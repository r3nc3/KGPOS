import React, { useEffect, useState } from 'react'

const empty = { username: '', full_name: '', role: 'cashier', password: '' }

export default function Users() {
  const [users, setUsers] = useState([])
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [serverError, setServerError] = useState('')

  const load = () => window.api.getUsers().then(setUsers)
  useEffect(() => { load() }, [])

  const openNew = () => { setEditId(null); setForm(empty); setServerError(''); setModal(true) }
  const openEdit = (u) => { setEditId(u.id); setForm({ username: u.username, full_name: u.full_name, role: u.role, password: '' }); setServerError(''); setModal(true) }

  const save = async () => {
    setServerError('')
    if (!form.username || !form.full_name) return
    let res
    if (editId) {
      res = await window.api.updateUser({ id: editId, ...form })
    } else {
      if (!form.password) return
      res = await window.api.createUser(form)
    }
    if (res && res.ok === false) {
      setServerError(res.error || 'Failed to save user')
      return
    }
    setModal(false)
    load()
  }

  const toggle = async (u) => {
    await window.api.toggleUserActive({ id: u.id, active: u.active ? 0 : 1 })
    load()
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const roleBadge = (r) => `badge badge-${r}`

  return (
    <div>
      <div className="page-header">
        <h1>Users & Employees</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Add User</button>
      </div>

      <div className="card">
        {users.length === 0 ? (
          <div className="empty-state">No users yet</div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Username</th><th>Full Name</th><th>Role</th><th>Status</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.username}</td>
                  <td>{u.full_name}</td>
                  <td><span className={roleBadge(u.role)}>{u.role}</span></td>
                  <td><span className={u.active ? 'badge badge-active' : 'badge badge-inactive'}>{u.active ? 'Active' : 'Inactive'}</span></td>
                  <td>{u.created_at}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>{' '}
                    <button className="btn btn-danger btn-sm" onClick={() => toggle(u)}>{u.active ? 'Disable' : 'Enable'}</button>
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
            <h2>{editId ? 'Edit User' : 'Add User'}</h2>
            {serverError && <div className="alert alert-error">{serverError}</div>}
            <div className="form-grid">
              <div className="form-field"><label>Username *</label><input value={form.username} onChange={set('username')} /></div>
              <div className="form-field"><label>Full Name *</label><input value={form.full_name} onChange={set('full_name')} /></div>
              <div className="form-field"><label>Role</label>
                <select value={form.role} onChange={set('role')}>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-field">
                <label>{editId ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input type="password" value={form.password} onChange={set('password')} />
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
