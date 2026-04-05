function ConfirmDialog({ isOpen, onClose, onConfirm, message }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose}></div>
      <div className="bg-white rounded-xl shadow-card-md w-full max-w-sm mx-4 relative z-10 p-6 text-center">
        <p className="text-gray-700 mb-6">{message || 'Bạn có chắc chắn muốn xóa?'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
            Hủy
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors">
            Xóa
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
