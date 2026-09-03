import React from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../App'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">KGPOS</div>
        <NavLink to="/" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} end>Dashboard</NavLink>
        <NavLink to="/checkout" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Checkout</NavLink>
        <NavLink to="/products" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Products</NavLink>
        <NavLink to="/inventory" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Inventory</NavLink>
        <NavLink to="/sales" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Sales & Reports</NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/users" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Users</NavLink>
        )}
        <div className="sidebar-footer">
          <div>{user?.full_name}</div>
          <div style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 8px' }}>{user?.role} · {user?.username}</div>
          <button className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/login') }}>Log out</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  )
}
