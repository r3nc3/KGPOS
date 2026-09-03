const { app } = require('electron')
const path = require('path')
const bcrypt = require('bcryptjs')
const Database = require('better-sqlite3')

const fs = require('fs')
const dbDir = path.join(app.getPath('userData'), 'db')
fs.mkdirSync(dbDir, { recursive: true })
const db = new Database(path.join(dbDir, 'kgpos.db'))
db.pragma('journal_mode = WAL')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'cashier', 'manager')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  barcode TEXT UNIQUE,
  category TEXT,
  price REAL NOT NULL DEFAULT 0,
  cost REAL NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_no TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  username TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  cash_received REAL,
  change_due REAL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sales_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  line_total REAL NOT NULL
);
`)

app.whenReady().then(() => {
  try {
    const count = db.prepare('SELECT COUNT(*) n FROM products').get().n
    if (count > 0) {
      console.log('SEED: products already exist, skipping')
      app.exit(0)
      return
    }

    const insUser = db.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?,?,?,?)')
    const insProduct = db.prepare('INSERT INTO products (name, barcode, category, price, cost, stock, low_stock_threshold) VALUES (?,?,?,?,?,?,?)')

    const adminPass = db.prepare('SELECT id FROM users WHERE username=?').get('admin')
    if (!adminPass) insUser.run('admin', bcrypt.hashSync('admin', 10), 'Administrator', 'admin')
    insUser.run('cashier', bcrypt.hashSync('cashier', 10), 'Demo Cashier', 'cashier')
    insUser.run('manager', bcrypt.hashSync('manager', 10), 'Demo Manager', 'manager')

    const products = [
      ['Espresso', '1001', 'Beverages', 3.50, 1.20, 120, 20],
      ['Cappuccino', '1002', 'Beverages', 4.00, 1.50, 90, 20],
      ['Latte', '1003', 'Beverages', 4.50, 1.70, 75, 20],
      ['Croissant', '2001', 'Bakery', 2.75, 1.00, 40, 10],
      ['Bagel', '2002', 'Bakery', 2.25, 0.80, 5, 10],
      ['Chocolate Bar', '3001', 'Snacks', 1.50, 0.60, 200, 30],
      ['Chips', '3002', 'Snacks', 2.00, 0.90, 60, 15],
      ['Soda (Can)', '4001', 'Drinks', 1.25, 0.45, 150, 30],
      ['Bottled Water', '4002', 'Drinks', 1.00, 0.30, 300, 50],
      ['Sandwich', '5001', 'Food', 5.75, 2.50, 25, 10]
    ]
    for (const p of products) insProduct.run(...p)

    const allProducts = db.prepare('SELECT * FROM products').all()
    const mkSale = db.prepare(`INSERT INTO sales (receipt_no, user_id, username, subtotal, tax, discount, total, payment_method, cash_received, change_due, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    const mkItem = db.prepare('INSERT INTO sales_items (sale_id, product_id, product_name, unit_price, quantity, line_total) VALUES (?,?,?,?,?,?)')

    const dayAgo = (d) => {
      const t = new Date(Date.now() - d * 86400000)
      return t.toISOString().slice(0, 19).replace('T', ' ')
    }

    const sales = [
      { d: 0, items: [[allProducts[0], 2], [allProducts[2], 1]], method: 'cash' },
      { d: 0, items: [[allProducts[4], 3]], method: 'card' },
      { d: 0, items: [[allProducts[7], 2], [allProducts[8], 1]], method: 'cash' },
      { d: 1, items: [[allProducts[1], 1], [allProducts[3], 2]], method: 'mobile' },
      { d: 2, items: [[allProducts[9], 1], [allProducts[0], 1]], method: 'cash' }
    ]

    for (let i = 0; i < sales.length; i++) {
      const s = sales[i]
      let subtotal = 0
      const items = []
      for (const [prod, qty] of s.items) {
        const line = prod.price * qty
        subtotal += line
        items.push([prod, qty, line])
      }
      const total = subtotal
      const cashRec = s.method === 'cash' ? Math.ceil(total) : null
      const change = cashRec ? cashRec - total : null
      const r = mkSale.run(`DEMO-${i + 1}`, 2, 'cashier', subtotal, 0, 0, total, s.method, cashRec, change, dayAgo(s.d))
      for (const [prod, qty, line] of items) {
        mkItem.run(r.lastInsertRowid, prod.id, prod.name, prod.price, qty, line)
      }
    }

    console.log('SEED: demo data created (10 products, 3 users, 5 sales)')
  } catch (e) {
    console.error('SEED_ERROR:', e.message)
    app.exit(1)
    return
  }
  app.exit(0)
})
