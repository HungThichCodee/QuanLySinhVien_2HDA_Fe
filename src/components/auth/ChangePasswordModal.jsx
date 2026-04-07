import { useState } from 'react'
import { changePassword } from '../../services/auth.js'
import Toast from '../ui/Toast.jsx'
import Modal from '../ui/Modal.jsx'

function ChangePasswordModal({ isOpen, onClose }) {
  let [oldPassword, setOldPassword] = useState('')
  let [newPassword, setNewPassword] = useState('')
  let [confirmPassword, setConfirmPassword] = useState('')
  let [loading, setLoading] = useState(false)
  let [toast, setToast] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setToast({ message: 'Mật khẩu xác nhận không khớp', type: 'error' })
      return
    }

    setLoading(true)
    try {
      await changePassword(oldPassword, newPassword)
      setToast({ message: 'Đổi mật khẩu thành công', type: 'success' })
      setTimeout(function() {
        onClose()
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }, 1500)
    } catch (err) {
      setToast({ message: err.message || 'Lỗi đổi mật khẩu', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <Modal isOpen={isOpen} onClose={onClose} title="Đổi mật khẩu">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
            <input type="password" required value={oldPassword} onChange={function (e) { setOldPassword(e.target.value) }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
            <input type="password" required value={newPassword} onChange={function (e) { setNewPassword(e.target.value) }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              placeholder="Ví dụ: SinhVien123@" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
            <input type="password" required value={confirmPassword} onChange={function (e) { setConfirmPassword(e.target.value) }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm" />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 rounded-lg text-sm bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-50">
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default ChangePasswordModal
