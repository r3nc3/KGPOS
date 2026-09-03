import React, { useEffect, useState } from 'react'

const empty = { name: '', barcode: '', category: '', price: 0, cost: 0, stock: 0, low_stock_threshold: 5 }

export default function Products() {
  const [products, setProducts] = useState([])
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')

  const load = () => window.api.getProducts().then(setProducts)
  useEffect(() => { load() }, [])

  const openNew = () => { setEditId(null); setForm(empty); setModal(true) }
  const openEdit = (p) => { setEditId(p.id); setForm({ ...p }); setModal(true) }

  const save = async () => {
    if (!form.name) return
    const payload = { ...form, price: Number(form.price), cost: Number(form.cost), stock: Number(form.stock), low_stock_threshold: Number(form.low_stock_threshold) }
    if (editId) await window.api.updateProduct({ id: editId, ...payload })
    else await window.api.createProduct(payload)
    setModal(false)
    load()
  }

  const remove = async (p) => {
    if (confirm(`Delete "${p.name}"?`)) {
      await window.api.deleteProduct(p.id)
      load()
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Add Product</button>
      </div>

      <div className="toolbar">
        <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 280 }} />
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">No products found</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th><th>Barcode</th><th>Category</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Stock</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.barcode || '-'}</td>
                  <td>{p.category || '-'}</td>
                  <td style={{ textAlign: 'right' }}>${p.price.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: p.stock <= p.low_stock_threshold ? '#dc2626' : 'inherit' }}>{p.stock}</td>
                  <td><span className={p.active ? 'badge badge-active' : 'badge badge-inactive'}>{p.active ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>{' '}
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editId ? 'Edit Product' : 'Add Product'}</h2>
            <div className="form-grid">
              <div className="form-field" style={{ gridColumn: '1 / -1' }}><label>Name *</label><input value={form.name} onChange={set('name')} /></div>
              <div className="form-field"><label>Barcode</label><input value={form.barcode || ''} onChange={set('barcode')} /></div>
              <div className="form-field"><label>Category</label><input value={form.category || ''} onChange={set('category')} /></div>
              <div className="form-field"><label>Price ($)</label><input type="number" step="0.01" value={form.price} onChange={set('price')} /></div>
              <div className="form-field"><label>Cost ($)</label><input type="number" step="0.01" value={form.cost} onChange={set('cost')} /></div>
              <div className="form-field"><label>Stock</label><input type="number" value={form.stock} onChange={set('stock')} /></div>
              <div className="form-field"><label>Low Stock Alert</label><input type="number" value={form.low_stock_threshold} onChange={set('low_stock_threshold')} /></div>
              <div className="form-field"><label>Active</label>
                <select value={form.active} onChange={(e) => setForm({ ...form, active: Number(e.target.value) })}>
                  <option value={1}>Yes</option><option value={0}>No</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
