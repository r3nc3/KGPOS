const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const bcrypt = require('bcryptjs')
const db = require('./db')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

function ensureDefaultAdmin() {
  const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin')
  if (!admin) {
    const hash = bcrypt.hashSync('admin', 10)
    db.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)')
      .run('admin', hash, 'Administrator', 'admin')
  }
}

/* ---------------- AUTH ---------------- */
ipcMain.handle('auth:login', (e, { username, password }) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username)
  if (!user) return { ok: false, error: 'Invalid credentials' }
  const match = bcrypt.compareSync(password, user.password_hash)
  if (!match) return { ok: false, error: 'Invalid credentials' }
  return { ok: true, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } }
})

ipcMain.handle('auth:changePassword', (e, { userId, currentPassword, newPassword }) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  if (!user) return { ok: false, error: 'User not found' }
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) return { ok: false, error: 'Current password incorrect' }
  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId)
  return { ok: true }
})

/* ---------------- PRODUCTS ---------------- */
ipcMain.handle('products:list', () => {
  return db.prepare('SELECT * FROM products ORDER BY name').all()
})

ipcMain.handle('products:get', (e, id) => {
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id)
})

ipcMain.handle('products:create', (e, data) => {
  const r = db.prepare(`INSERT INTO products (name, barcode, category, price, cost, stock, low_stock_threshold)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(data.name, data.barcode || null, data.category || null, data.price, data.cost, data.stock, data.low_stock_threshold)
  return db.prepare('SELECT * FROM products WHERE id = ?').get(r.lastInsertRowid)
})

ipcMain.handle('products:update', (e, { id, ...data }) => {
  db.prepare(`UPDATE products SET name=?, barcode=?, category=?, price=?, cost=?, stock=?, low_stock_threshold=?, active=?
    WHERE id=?`)
    .run(data.name, data.barcode || null, data.category || null, data.price, data.cost, data.stock, data.low_stock_threshold, data.active, id)
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id)
})

ipcMain.handle('products:delete', (e, id) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(id)
  return { ok: true }
})

/* ---------------- USERS ---------------- */
ipcMain.handle('users:list', () => {
  return db.prepare('SELECT id, username, full_name, role, active, created_at FROM users ORDER BY username').all()
})

ipcMain.handle('users:create', (e, data) => {
  const hash = bcrypt.hashSync(data.password, 10)
  try {
    const r = db.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)')
      .run(data.username, hash, data.full_name, data.role)
    return { ok: true, id: r.lastInsertRowid }
  } catch (err) {
    return { ok: false, error: 'Username already exists' }
  }
})

ipcMain.handle('users:update', (e, { id, ...data }) => {
  if (data.password) {
    const hash = bcrypt.hashSync(data.password, 10)
    db.prepare('UPDATE users SET username=?, full_name=?, role=?, password_hash=? WHERE id=?')
      .run(data.username, data.full_name, data.role, hash, id)
  } else {
    db.prepare('UPDATE users SET username=?, full_name=?, role=? WHERE id=?')
      .run(data.username, data.full_name, data.role, id)
  }
  return { ok: true }
})

ipcMain.handle('users:toggleActive', (e, { id, active }) => {
  db.prepare('UPDATE users SET active=? WHERE id=?').run(active ? 1 : 0, id)
  return { ok: true }
})

/* ---------------- SALES ---------------- */
ipcMain.handle('sales:create', (e, { items, subtotal, tax, discount, total, paymentMethod, cashReceived, changeDue, userId }) => {
  const receiptNo = 'RCP-' + Date.now() + '-' + Math.floor(Math.random() * 900 + 100)
  const username = db.prepare('SELECT username FROM users WHERE id = ?').get(userId)?.username || null

  const insertSale = db.transaction(() => {
    const r = db.prepare(`INSERT INTO sales
      (receipt_no, user_id, username, subtotal, tax, discount, total, payment_method, cash_received, change_due)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(receiptNo, userId, username, subtotal, tax, discount, total, paymentMethod, cashReceived ?? null, changeDue ?? null)

    const saleId = r.lastInsertRowid
    const insertItem = db.prepare(`INSERT INTO sales_items
      (sale_id, product_id, product_name, unit_price, quantity, line_total)
      VALUES (?, ?, ?, ?, ?, ?)`)
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')

    for (const item of items) {
      insertItem.run(saleId, item.product_id, item.product_name, item.unit_price, item.quantity, item.line_total)
      if (item.product_id) updateStock.run(item.quantity, item.product_id)
    }
    return saleId
  })

  const saleId = insertSale()
  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId)
  const saleItems = db.prepare('SELECT * FROM sales_items WHERE sale_id = ?').all(saleId)
  return { sale, items: saleItems }
})

ipcMain.handle('sales:list', (e, { from, to } = {}) => {
  if (from && to) {
    return db.prepare('SELECT * FROM sales WHERE date(created_at) BETWEEN ? AND ? ORDER BY id DESC').all(from, to)
  }
  return db.prepare('SELECT * FROM sales ORDER BY id DESC LIMIT 500').all()
})

ipcMain.handle('sales:getItems', (e, saleId) => {
  return db.prepare('SELECT * FROM sales_items WHERE sale_id = ?').all(saleId)
})

ipcMain.handle('sales:summary', (e, { from, to } = {}) => {
  let rows
  if (from && to) {
    rows = db.prepare('SELECT * FROM sales WHERE date(created_at) BETWEEN ? AND ?').all(from, to)
  } else {
    rows = db.prepare('SELECT * FROM sales').all()
  }
  const total_sales = rows.length
  const total_revenue = rows.reduce((s, r) => s + r.total, 0)
  const total_items = db.prepare('SELECT COALESCE(SUM(quantity),0) AS n FROM sales_items').get().n
  return { total_sales, total_revenue, total_items }
})

/* ---------------- DASHBOARD ---------------- */
ipcMain.handle('dashboard:stats', () => {
  return {
    products: db.prepare('SELECT COUNT(*) AS n FROM products WHERE active = 1').get().n,
    low_stock: db.prepare('SELECT COUNT(*) AS n FROM products WHERE stock <= low_stock_threshold').get().n,
    users: db.prepare('SELECT COUNT(*) AS n FROM users WHERE active = 1').get().n,
    today_revenue: db.prepare("SELECT COALESCE(SUM(total),0) AS n FROM sales WHERE date(created_at) = date('now')").get().n,
    today_sales: db.prepare("SELECT COUNT(*) AS n FROM sales WHERE date(created_at) = date('now')").get().n,
    recent_sales: db.prepare('SELECT * FROM sales ORDER BY id DESC LIMIT 5').all()
  }
})

/* ---------------- PRINT ---------------- */
ipcMain.handle('print:receipt', (e, html) => {
  const { webContents } = e.sender
  const win = BrowserWindow.fromWebContents(webContents)
  const printWindow = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false } })
  return new Promise((resolve) => {
    printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print({ silent: true, printBackground: true }, (success, reason) => {
        printWindow.close()
        resolve({ ok: success, reason })
      })
    })
  })
})

app.whenReady().then(() => {
  ensureDefaultAdmin()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
