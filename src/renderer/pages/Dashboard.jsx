import React, { useEffect, useState } from 'react'

const fmt = (n) => (Number(n) || 0).toFixed(2)

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    window.api.getDashboardStats().then(setStats)
  }, [])

  if (!stats) return <div className="empty-state">Loading...</div>

  return (
    <div>
      <div className="page-header"><h1>Dashboard</h1></div>

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
