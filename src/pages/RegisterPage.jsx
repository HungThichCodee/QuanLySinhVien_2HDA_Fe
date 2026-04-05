import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import * as authService from '../services/auth.service.js'

function RegisterPage() {
  let [form, setForm] = useState({ username: '', password: '', email: '', fullName: '', studentCode: '' })
  let [error, setError] = useState('')
  let [loading, setLoading] = useState(false)
  let navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.register(form)
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Dang ky that bai')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary font-display">QLSV</h1>
          <p className="text-gray-500 mt-2">Tao tai khoan moi</p>
        </div>

        <div className="bg-white rounded-xl shadow-card-md p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 font-display">Dang ky</h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-200">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập</label>
              <input type="text" name="username" value={form.username} onChange={handleChange} autoComplete="username"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ tên</label>
              <input type="text" name="fullName" value={form.fullName} onChange={handleChange} autoComplete="name"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã sinh viên</label>
              <input type="text" name="studentCode" value={form.studentCode} onChange={handleChange} autoComplete="username"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} autoComplete="new-password"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50">
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-4">
            Đã có tài khoản? <Link to="/login" className="text-primary hover:underline font-medium">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
