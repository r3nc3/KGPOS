import React, { useEffect, useState } from 'react'

const fmt = (n) => (Number(n) || 0).toFixed(2)

export default function Sales() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sales, setSales] = useState([])
  const [summary, setSummary] = useState({ total_sales: 0, total_revenue: 0, total_items: 0 })
  const [selected, setSelected] = useState(null)
  const [items, setItems] = useState([])

  const load = async () => {
    const range = from && to ? { from, to } : undefined
    const [s, sum] = await Promise.all([window.api.getSales(range), window.api.getSalesSummary(range)])
    setSales(s)
    setSummary(sum)
  }

  useEffect(() => { load() }, [])

  const view = async (id) => {
    const it = await window.api.getSaleItems(id)
    const s = sales.find((x) => x.id === id)
    setSelected(s)
    setItems(it)
  }

  const close = () => { setSelected(null); setItems([]) }

  const print = async () => {
    if (!selected) return
    const html = [
      '<div style="font-family: monospace; width: 280px; margin: 0 auto;">',
      '<div style="text-align:center;font-size:18px;font-weight:bold;">KGPOS</div>',
      `<div>Receipt: ${selected.receipt_no}</div>`,
      `<div>Date: ${selected.created_at}</div>`,
      `<div>Cashier: ${selected.username}</div><hr/>`
    ]
    items.forEach((i) => {
      html.push(`<div>${i.product_name}</div><div style="text-align:right;">${i.quantity} x ${fmt(i.unit_price)} = ${fmt(i.line_total)}</div>`)
    })
    html.push('<hr/>')
    html.push(`<div>Subtotal: ${fmt(selected.subtotal)}</div>`)
    html.push(`<div>TOTAL: <b>${fmt(selected.total)}</b></div>`)
    html.push(`<div>Payment: ${selected.payment_method}</div>`)
    html.push('</div>')
    await window.api.printReceipt(html.join('\n'))
  }

  const exportCSV = () => {
    let csv = 'Receipt,Date,Cashier,Payment,Subtotal,Tax,Discount,Total\n'
    sales.forEach((s) => {
      csv += `${s.receipt_no},"${s.created_at}","${s.username || ''}",${s.payment_method},${s.subtotal},${s.tax},${s.discount},${s.total}\n`
    })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sales-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="page-header"><h1>Sales & Reports</h1></div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Transactions</div><div className="stat-value">{summary.total_sales}</div></div>
        <div className="stat-card"><div className="stat-label">Total Revenue</div><div className="stat-value" style={{ color: '#16a34a' }}>${fmt(summary.total_revenue)}</div></div>
        <div className="stat-card"><div className="stat-label">Items Sold</div><div className="stat-value">{summary.total_items}</div></div>
      </div>

      <div className="card">
        <div className="toolbar">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span>to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <button className="btn btn-secondary" onClick={load}>Apply</button>
          <button className="btn btn-secondary" onClick={() => { setFrom(''); setTo(''); setTimeout(load, 0) }}>Clear</button>
          <button className="btn btn-primary" onClick={exportCSV} style={{ marginLeft: 'auto' }}>Export CSV</button>
        </div>

        {sales.length === 0 ? (
          <div className="empty-state">No sales in this period</div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Receipt</th><th>Date</th><th>Cashier</th><th>Payment</th><th style={{ textAlign: 'right' }}>Total</th><th></th></tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td>{s.receipt_no}</td>
                  <td>{s.created_at}</td>
                  <td>{s.username}</td>
                  <td>{s.payment_method}</td>
                  <td style={{ textAlign: 'right' }}>${fmt(s.total)}</td>
                  <td><button className="btn btn-secondary btn-sm" onClick={() => view(s.id)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Sale {selected.receipt_no}</h2>
            <div style={{ marginBottom: 12, fontSize: 14 }}>
              <div>{selected.created_at} · {selected.username} · {selected.payment_method}</div>
            </div>
            <table className="table">
              <thead><tr><th>Item</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.product_name}</td>
                    <td style={{ textAlign: 'right' }}>{i.quantity}</td>
                    <td style={{ textAlign: 'right' }}>${fmt(i.unit_price)}</td>
                    <td style={{ textAlign: 'right' }}>${fmt(i.line_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700 }}><td colSpan={3} style={{ textAlign: 'right' }}>Total</td><td style={{ textAlign: 'right' }}>${fmt(selected.total)}</td></tr>
              </tfoot>
            </table>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={print}>Print Receipt</button>
              <button className="btn btn-primary" onClick={close}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
