import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { resetPassword } from '../services/auth.js'
import Toast from '../components/ui/Toast.jsx'

function ResetPasswordPage() {
  let { token } = useParams()
  let navigate = useNavigate()
  let [password, setPassword] = useState('')
  let [confirmPassword, setConfirmPassword] = useState('')
  let [loading, setLoading] = useState(false)
  let [toast, setToast] = useState(null)
  let [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setToast({ message: 'Mật khẩu xác nhận không khớp', type: 'error' })
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setSuccess(true)
      setToast({ message: 'Cập nhật mật khẩu thành công', type: 'success' })
      setTimeout(function() {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setToast({ message: err.message || 'Lý do: token hết hạn hoặc không hợp lệ', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <div className="max-w-md w-full bg-white rounded-xl shadow-card p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-primary font-display mb-2">Tạo Mật Khẩu Mới</h2>
          <p className="text-sm text-gray-500">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</p>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-sm text-gray-700 mb-6">Mật khẩu đã được cập nhật thành công. Đang chuyển hướng đến trang đăng nhập...</p>
            <Link to="/login" className="text-primary hover:underline font-semibold block text-center">Đăng nhập ngay</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
              <input type="password" required value={password} onChange={function (e) { setPassword(e.target.value) }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                placeholder="Ví dụ: SinhVien123@" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
              <input type="password" required value={confirmPassword} onChange={function (e) { setConfirmPassword(e.target.value) }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                placeholder="Nhập lại mật khẩu mới" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors mt-2 disabled:opacity-50">
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>

            <div className="text-center mt-4">
              <Link to="/login" className="text-primary hover:underline text-sm font-medium">Bỏ qua / Trở về đăng nhập</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage
