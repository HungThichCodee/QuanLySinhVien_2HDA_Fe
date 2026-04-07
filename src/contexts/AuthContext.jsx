import { createContext, useState, useEffect } from 'react'
import * as authService from '../services/auth.js'

export let AuthContext = createContext(null)

export function AuthProvider({ children }) {
  let [user, setUser] = useState(null)
  let [token, setToken] = useState(localStorage.getItem('token'))
  let [loading, setLoading] = useState(true)

  useEffect(function () {
    if (token) {
      authService.getMe().then(function (data) {
        setUser(data)
        setLoading(false)
      }).catch(function () {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [token])

  function login(newToken) {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  function logout() {
    authService.logout().catch(function () { })
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  let isAdmin = user && user.role === 'ADMIN'
  let isTeacher = user && user.role === 'TEACHER'
  let isStudent = user && user.role === 'STUDENT'

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isTeacher, isStudent }}>
      {children}
    </AuthContext.Provider>
  )
}
