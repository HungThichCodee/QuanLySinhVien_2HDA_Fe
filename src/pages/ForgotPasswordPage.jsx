import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/auth.js'
import Toast from '../components/ui/Toast.jsx'

function ForgotPasswordPage() {
  let [email, setEmail] = useState('')
  let [loading, setLoading] = useState(false)
  let [toast, setToast] = useState(null)
  let [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await forgotPassword(email)
      setSuccess(true)
      setToast({ message: 'Đã gửi liên kết khôi phục mật khẩu vào email của bạn', type: 'success' })
    } catch (err) {
      setToast({ message: err.message || 'Lỗi gửi yêu cầu', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <div className="max-w-md w-full bg-white rounded-xl shadow-card p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-primary font-display mb-2">Quên Mật Khẩu</h2>
          <p className="text-sm text-gray-500">Nhập email để nhận liên kết khôi phục mật khẩu.</p>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-sm text-gray-700 mb-6">Vui lòng kiểm tra hộp thư đến (cả mục Spam) để lấy liên kết khôi phục.</p>
            <Link to="/login" className="text-primary hover:underline font-semibold block text-center">Quay lại đăng nhập</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email của bạn</label>
              <input id="email" type="email" required value={email} onChange={function (e) { setEmail(e.target.value) }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                placeholder="VD: user@test.com" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50">
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-primary hover:underline text-sm font-medium">Quay lại đăng nhập</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
