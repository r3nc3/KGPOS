import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const fmt = (n) => (Number(n) || 0).toFixed(2)

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [scanInput, setScanInput] = useState('')
  const [scanAlert, setScanAlert] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    window.api.getDashboardStats().then(setStats)
    window.api.getProducts().then((p) => setProducts(p.filter((x) => x.active)))
  }, [])

  const handleScan = () => {
    const code = scanInput.trim()
    setScanInput('')
    if (!code) return
    const p = products.find((x) => (x.barcode || '').toString().trim() === code && x.active)
    if (!p) {
      setScanAlert(`Product not found for barcode: ${code}`)
      return
    }
    // Stage the scanned product and jump into a fresh sale on Checkout.
    sessionStorage.setItem('kgpos_pending_scan', JSON.stringify(p))
    navigate('/checkout')
  }

  if (!stats) return <div className="empty-state">Loading...</div>

  return (
    <div>
      <div className="page-header"><h1>Dashboard</h1></div>

      <div className="card" style={{ padding: '14px 16px' }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Scan barcode to start a sale
        </label>
        <input
          className="product-search"
          placeholder="Point scanner here → jumps to Checkout with product added"
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleScan()
          }}
        />
        {scanAlert && <div className="alert alert-error">{scanAlert}</div>}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Today's Revenue</div>
          <div className="stat-value" style={{ color: '#16a34a' }}>${fmt(stats.today_revenue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's Sales</div>
          <div className="stat-value">{stats.today_sales}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Products</div>
          <div className="stat-value">{stats.products}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value" style={{ color: stats.low_stock > 0 ? '#dc2626' : '#16a34a' }}>{stats.low_stock}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Users</div>
          <div className="stat-value">{stats.users}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14 }}>Recent Sales</h3>
        {stats.recent_sales.length === 0 ? (
          <div className="empty-state">No sales yet</div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Receipt</th><th>Date</th><th>Cashier</th><th>Method</th><th style={{ textAlign: 'right' }}>Total</th></tr>
            </thead>
            <tbody>
              {stats.recent_sales.map((s) => (
                <tr key={s.id}>
                  <td>{s.receipt_no}</td>
                  <td>{s.created_at}</td>
                  <td>{s.username}</td>
                  <td>{s.payment_method}</td>
                  <td style={{ textAlign: 'right' }}>${fmt(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
