import React, { createContext, useContext, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Users from './pages/Users'
import Checkout from './pages/Checkout'
import Sales from './pages/Sales'
import Login from './pages/Login'
import Layout from './components/Layout'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('kgpos_user') || 'null'))
  const navigate = useNavigate()

  const login = (u) => {
    setUser(u)
    localStorage.setItem('kgpos_user', JSON.stringify(u))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('kgpos_user')
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/users" element={<Users />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthContext.Provider>
  )
}
