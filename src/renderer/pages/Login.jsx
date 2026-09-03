import React, { useState } from 'react'
import { useAuth } from '../App'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await window.api.login({ username, password })
    setLoading(false)
    if (res.ok) {
      login(res.user)
    } else {
      setError(res.error || 'Login failed')
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="brand-big">KGPOS</div>
        <div className="brand-sub">Point of Sale</div>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-field" style={{ marginBottom: 14 }}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="form-field" style={{ marginBottom: 20 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <div style={{ marginTop: 14, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
          Default admin login: <code>admin</code> / <code>admin</code>
        </div>
      </form>
    </div>
  )
}
