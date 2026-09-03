import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../App'

const fmt = (n) => (Number(n) || 0).toFixed(2)

function ReceiptHTML(sale, items, cashierName) {
  const now = new Date()
  const lines = [
    '<div style="font-family: monospace; width: 280px; margin: 0 auto; font-size: 13px;">',
    '<div style="text-align:center;font-size:18px;font-weight:bold;">KGPOS</div>',
    '<div style="text-align:center;margin-bottom:8px;">Thank you for your purchase!</div>',
    `<div>Receipt: ${sale.receipt_no}</div>`,
    `<div>Date: ${now.toLocaleString()}</div>`,
    `<div>Cashier: ${cashierName}</div>`,
    '<hr/>'
  ]
  items.forEach((i) => {
    lines.push(`<div>${i.product_name}</div>`)
    lines.push(`<div style="text-align:right;">${i.quantity} x ${fmt(i.unit_price)} = ${fmt(i.line_total)}</div>`)
  })
  lines.push('<hr/>')
  lines.push(`<div style="display:flex;justify-content:space-between;"><span>Subtotal</span><span>${fmt(sale.subtotal)}</span></div>`)
  if (sale.discount > 0) lines.push(`<div style="display:flex;justify-content:space-between;"><span>Discount</span><span>-${fmt(sale.discount)}</span></div>`)
  lines.push(`<div style="display:flex;justify-content:space-between;"><span>Tax</span><span>${fmt(sale.tax)}</span></div>`)
  lines.push(`<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;"><span>TOTAL</span><span>${fmt(sale.total)}</span></div>`)
  lines.push(`<div>Payment: ${sale.payment_method}</div>`)
  if (sale.payment_method === 'cash' && sale.cash_received != null) {
    lines.push(`<div>Cash: ${fmt(sale.cash_received)}</div>`)
    lines.push(`<div>Change: ${fmt(sale.change_due)}</div>`)
  }
  lines.push('<hr/>')
  lines.push('<div style="text-align:center;">Have a great day!</div>')
  lines.push('</div>')
  return lines.join('\n')
}

export default function Checkout() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [alert, setAlert] = useState('')
  const [processing, setProcessing] = useState(false)

  const load = () => window.api.getProducts().then((p) => setProducts(p.filter((x) => x.active)))
  useEffect(() => { load() }, [])

  const filtered = useMemo(() =>
    products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').includes(search) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase())
    ).slice(0, 100),
    [products, search])

  const addToCart = (p) => {
    setAlert('')
    setCart((c) => {
      const existing = c.find((i) => i.product_id === p.id)
      if (existing) {
        if (existing.quantity + 1 > p.stock) { setAlert(`Only ${p.stock} in stock`); return c }
        return c.map((i) => i.product_id === p.id ? { ...i, quantity: i.quantity + 1, line_total: (i.quantity + 1) * i.unit_price } : i)
      }
      if (p.stock <= 0) { setAlert('Out of stock'); return c }
      return [...c, { product_id: p.id, product_name: p.name, unit_price: p.price, quantity: 1, line_total: p.price }]
    })
  }

  const incQty = (id) => {
    const p = products.find((x) => x.id === id)
    setCart((c) => c.map((i) => {
      if (i.product_id !== id) return i
      if (i.quantity + 1 > p.stock) { setAlert(`Only ${p.stock} in stock`); return i }
      const q = i.quantity + 1
      return { ...i, quantity: q, line_total: q * i.unit_price }
    }))
  }

  const decQty = (id) => {
    setCart((c) => c.map((i) => {
      if (i.product_id !== id) return i
      const q = i.quantity - 1
      if (q <= 0) return null
      return { ...i, quantity: q, line_total: q * i.unit_price }
    }).filter(Boolean))
  }

  const removeLine = (id) => setCart((c) => c.filter((i) => i.product_id !== id))

  const subtotal = cart.reduce((s, i) => s + i.line_total, 0)
  const tax = 0
  const total = subtotal

  const cash = Number(cashReceived) || 0
  const change = cash - total

  const clearCart = () => { setCart([]); setCashReceived(''); setAlert(''); setShowConfirm(false) }

  const complete = async () => {
    setProcessing(true)
    try {
      const res = await window.api.createSale({
        items: cart, subtotal, tax, discount: 0, total,
        paymentMethod, cashReceived: paymentMethod === 'cash' ? cash : null,
        changeDue: paymentMethod === 'cash' ? change : null, userId: user.id
      })
      const html = ReceiptHTML(res.sale, res.items, user.full_name)
      window.api.printReceipt(html)
      clearCart()
      setAlert('Sale completed! Receipt printed.')
      load()
    } catch (e) {
      setAlert('Sale failed: ' + e.message)
    }
    setProcessing(false)
  }

  return (
    <div>
      <div className="page-header"><h1>Checkout</h1></div>
      {alert && <div className="alert alert-success">{alert}</div>}

      <div className="checkout">
        <div>
          <input className="product-search" placeholder="Search or scan barcode..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          <div className="product-grid">
            {filtered.map((p) => (
              <div key={p.id} className="product-tile" onClick={() => addToCart(p)}>
                <div className="p-name">{p.name}</div>
                <div className="p-price">${fmt(p.price)}</div>
                <div className="p-stock">Stock: {p.stock}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-panel">
          <h3 style={{ marginBottom: 10 }}>Current Sale</h3>
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-state">Cart is empty</div>
            ) : cart.map((i) => (
              <div className="cart-line" key={i.product_id}>
                <div>
                  <div style={{ fontWeight: 500 }}>{i.product_name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>${fmt(i.unit_price)} each</div>
                </div>
                <div className="qty-controls">
                  <button onClick={() => decQty(i.product_id)}>−</button>
                  <span style={{ minWidth: 20, textAlign: 'center' }}>{i.quantity}</span>
                  <button onClick={() => incQty(i.product_id)}>+</button>
                </div>
                <div style={{ fontWeight: 600, minWidth: 60, textAlign: 'right' }}>${fmt(i.line_total)}</div>
                <button className="btn btn-danger btn-sm" onClick={() => removeLine(i.product_id)}>×</button>
              </div>
            ))}
          </div>

          <div className="cart-totals">
            <div className="total-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
            <div className="total-row"><span>Payment</span>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile</option>
              </select>
            </div>
            {paymentMethod === 'cash' && (
              <div className="total-row"><span>Cash received</span>
                <input type="number" step="0.01" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} style={{ width: 100, textAlign: 'right' }} />
              </div>
            )}
            {paymentMethod === 'cash' && cashReceived && (
              <div className="total-row"><span>Change</span><span style={{ color: '#16a34a' }}>${fmt(change)}</span></div>
            )}
            <div className="total-row grand"><span>Total</span><span>${fmt(total)}</span></div>
          </div>

          {showConfirm && (
            <div className="confirm-banner" style={{ marginTop: 12 }}>
              <span>Complete this sale for <b>${fmt(total)}</b>?</span>
              <span>
                <button className="btn btn-success btn-sm" disabled={processing} onClick={complete}>{processing ? '...' : 'Yes'}</button>{' '}
                <button className="btn btn-secondary btn-sm" onClick={() => setShowConfirm(false)}>No</button>
              </span>
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={clearCart}>Clear</button>
            <button className="btn btn-success" disabled={cart.length === 0} onClick={() => setShowConfirm(true)}>Charge ${fmt(total)}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
