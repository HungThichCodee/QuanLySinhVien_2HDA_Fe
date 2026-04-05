function Toast({ message, type, onClose }) {
  if (!message) return null

  let colors = {
    success: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    info: 'bg-blue-50 text-primary border-blue-200',
  }

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-card-md text-sm font-medium flex items-center gap-2 animate-[slideIn_0.3s_ease] ${colors[type] || colors.info}`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">&times;</button>
    </div>
  )
}

export default Toast
