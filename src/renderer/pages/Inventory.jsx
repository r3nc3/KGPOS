import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const fmt = (n) => (Number(n) || 0).toFixed(2)

export default function Inventory() {
  const [inv, setInv] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [adjust, setAdjust] = useState(null)
  const [qty, setQty] = useState('')
  const navigate = useNavigate()

  const load = () => window.api.getInventory().then(setInv)
  useEffect(() => { load() }, [])

  const filtered = inv.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (filter === 'never-sold') return !p.has_been_sold
    if (filter === 'low') return p.stock <= p.low_stock_threshold
    if (filter === 'out') return p.stock <= 0
    return true
  })

  const applyAdjust = async () => {
    const n = Number(qty)
    if (!n || !adjust) return
    await window.api.adjustStock({ id: adjust.id, qty: n })
    setAdjust(null)
    setQty('')
    load()
  }

  const neverSold = inv.filter((p) => !p.has_been_sold).length
  const lowStock = inv.filter((p) => p.stock <= p.low_stock_threshold).length
  const outOfStock = inv.filter((p) => p.stock <= 0).length

  return (
    <div>
      <div className="page-header">
        <h1>Inventory</h1>
        <button className="btn btn-primary" onClick={() => navigate('/products')}>+ Add New Product</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Items</div><div className="stat-value">{inv.length}</div></div>
        <div className="stat-card"><div className="stat-label">Never Sold</div><div className="stat-value" style={{ color: '#7c3aed' }}>{neverSold}</div></div>
        <div className="stat-card"><div className="stat-label">Low Stock</div><div className="stat-value" style={{ color: '#d97706' }}>{lowStock}</div></div>
        <div className="stat-card"><div className="stat-label">Out of Stock</div><div className="stat-value" style={{ color: '#dc2626' }}>{outOfStock}</div></div>
      </div>

      <div className="card">
        <div className="toolbar">
          <input placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All items</option>
            <option value="never-sold">Never sold</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">No inventory items match this filter</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Product</th><th>Barcode</th><th>Category</th>
                <th style={{ textAlign: 'right' }}>Cost</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>In Stock</th>
                <th style={{ textAlign: 'right' }}>Total Sold</th>
                <th>Type</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={!p.active ? { opacity: 0.5 } : {}}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.barcode || '-'}</td>
                  <td>{p.category || '-'}</td>
                  <td style={{ textAlign: 'right' }}>${fmt(p.cost)}</td>
                  <td style={{ textAlign: 'right' }}>${fmt(p.price)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: p.stock <= p.low_stock_threshold ? '#dc2626' : 'inherit' }}>{p.stock}</td>
                  <td style={{ textAlign: 'right' }}>{p.total_sold}</td>
                  <td>
                    {p.has_been_sold
                      ? <span className="badge badge-active">Sold before</span>
                      : <span className="badge badge-manager">Never sold</span>}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setAdjust(p); setQty('') }}>Adjust Stock</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {adjust && (
        <div className="modal-overlay" onClick={() => setAdjust(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Adjust Stock: {adjust.name}</h2>
            <div style={{ marginBottom: 14, fontSize: 14 }}>Current stock: <b>{adjust.stock}</b></div>
            <div className="form-field" style={{ marginBottom: 8 }}>
              <label>Quantity to {'add (positive) / remove (negative)'}</label>
              <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setAdjust(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={applyAdjust}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
