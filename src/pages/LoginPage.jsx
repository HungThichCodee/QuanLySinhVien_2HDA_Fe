import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as authService from '../services/auth.js'

function LoginPage() {
  let [username, setUsername] = useState('')
  let [password, setPassword] = useState('')
  let [error, setError] = useState('')
  let [loading, setLoading] = useState(false)
  let { login } = useAuth()
  let navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let token = await authService.login(username, password)
      login(token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Dang nhap that bai')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary font-display">QLSV</h1>
          <p className="text-gray-500 mt-2">He thong Quan ly Sinh vien</p>
        </div>

        <div className="bg-white rounded-xl shadow-card-md p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 font-display">Đăng nhập</h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-200">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={function (e) { setUsername(e.target.value) }}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="Nhập username"
                autoComplete="username"
                required
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">Quên mật khẩu?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={function (e) { setPassword(e.target.value) }}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="Nhập password"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}

export default LoginPage
