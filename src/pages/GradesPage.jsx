import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import * as gradeService from '../services/grades.js'
import * as courseClassService from '../services/courseclasses.js'
import Toast from '../components/ui/Toast.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Modal from '../components/ui/Modal.jsx'
import { postFormData } from '../services/api.js'

function toLetterGrade(score) {
  if (score === undefined || score === null) return '-'
  if (score >= 8.5) return 'A'
  if (score >= 7.0) return 'B'
  if (score >= 5.5) return 'C'
  if (score >= 4.0) return 'D'
  return 'F'
}

function toGPA4(score) {
  if (score === undefined || score === null) return 0
  if (score >= 8.5) return 4.0
  if (score >= 7.0) return 3.0
  if (score >= 5.5) return 2.0
  if (score >= 4.0) return 1.0
  return 0
}

function letterColor(letter) {
  if (letter === 'A') return 'text-green-600 bg-green-50'
  if (letter === 'B') return 'text-blue-600 bg-blue-50'
  if (letter === 'C') return 'text-yellow-600 bg-yellow-50'
  if (letter === 'D') return 'text-orange-600 bg-orange-50'
  if (letter === 'F') return 'text-red-600 bg-red-50'
  return 'text-gray-400'
}

function clampScore(val) {
  let num = parseFloat(val)
  if (isNaN(num)) return ''
  if (num < 0) return 0
  if (num > 10) return 10
  return Math.round(num * 10) / 10
}

function GradesPage() {
  let { isStudent, isTeacher, isAdmin } = useAuth()
  let [grades, setGrades] = useState([])
  let [courseClasses, setCourseClasses] = useState([])
  let [selectedCC, setSelectedCC] = useState('')
  let [loading, setLoading] = useState(true)
  let [toast, setToast] = useState(null)
  let [confirmData, setConfirmData] = useState(null)
  let [editedGrades, setEditedGrades] = useState({})
  let [saving, setSaving] = useState(false)
  let [excelModalOpen, setExcelModalOpen] = useState(false)
  let [excelFile, setExcelFile] = useState(null)
  let [importing, setImporting] = useState(false)
  let fileInputRef = useRef(null)

  useEffect(function () {
    async function load() {
      try {
        if (isStudent) {
          let g = await gradeService.getMyGrades()
          setGrades(Array.isArray(g) ? g : [])
        }
        if (isTeacher) { let cc = await courseClassService.getMyTeaching(); setCourseClasses(cc) }
        if (isAdmin) { let cc = await courseClassService.getAll(); setCourseClasses(cc) }
      } catch (err) { console.log(err) }
      setLoading(false)
    }
    load()
  }, [isStudent, isTeacher, isAdmin])

  async function loadCCGrades(ccId) {
    setSelectedCC(ccId)
    setEditedGrades({})
    try { let g = await gradeService.getByCourseClass(ccId); setGrades(Array.isArray(g) ? g : []) }
    catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  function handleScoreChange(gradeId, field, value) {
    let raw = value.replace(/[^0-9.]/g, '')
    let parts = raw.split('.')
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('')
    let prev = editedGrades[gradeId] || {}
    let original = grades.find(function (g) { return g._id === gradeId })
    let updated = {
      attendanceScore: prev.attendanceScore !== undefined ? prev.attendanceScore : original.attendanceScore,
      midtermScore: prev.midtermScore !== undefined ? prev.midtermScore : original.midtermScore,
      finalScore: prev.finalScore !== undefined ? prev.finalScore : original.finalScore,
    }
    updated[field] = raw
    let cc = updated.attendanceScore !== undefined && updated.attendanceScore !== '' ? parseFloat(updated.attendanceScore) : undefined
    let gk = updated.midtermScore !== undefined && updated.midtermScore !== '' ? parseFloat(updated.midtermScore) : undefined
    let ck = updated.finalScore !== undefined && updated.finalScore !== '' ? parseFloat(updated.finalScore) : undefined
    let avg = undefined
    if (cc !== undefined && !isNaN(cc) && gk !== undefined && !isNaN(gk) && ck !== undefined && !isNaN(ck)) {
      avg = Math.round((cc * 0.1 + gk * 0.3 + ck * 0.6) * 100) / 100
    }
    updated.averageScore = avg
    setEditedGrades({ ...editedGrades, [gradeId]: updated })
  }

  function handleScoreBlur(gradeId, field) {
    let prev = editedGrades[gradeId]
    if (!prev || prev[field] === undefined || prev[field] === '') return
    let clamped = clampScore(prev[field])
    if (clamped !== prev[field]) {
      handleScoreChange(gradeId, field, String(clamped))
    }
  }

  function getDisplayValue(grade, field) {
    let edited = editedGrades[grade._id]
    if (edited && edited[field] !== undefined) return edited[field]
    return grade[field] !== undefined && grade[field] !== null ? grade[field] : ''
  }

  function getComputedAvg(grade) {
    let edited = editedGrades[grade._id]
    if (edited && edited.averageScore !== undefined) return edited.averageScore
    return grade.averageScore
  }

  let hasChanges = Object.keys(editedGrades).length > 0

  async function handleBulkSave() {
    let items = []
    for (let gradeId in editedGrades) {
      let e = editedGrades[gradeId]
      let payload = { gradeId: gradeId }
      if (e.attendanceScore !== undefined && e.attendanceScore !== '') payload.attendanceScore = clampScore(e.attendanceScore)
      if (e.midtermScore !== undefined && e.midtermScore !== '') payload.midtermScore = clampScore(e.midtermScore)
      if (e.finalScore !== undefined && e.finalScore !== '') payload.finalScore = clampScore(e.finalScore)
      items.push(payload)
    }
    if (items.length === 0) return
    setConfirmData({ items: items })
  }

  async function confirmBulkSave() {
    setSaving(true)
    try {
      await gradeService.bulkUpdate(confirmData.items)
      setToast({ message: 'Cập nhật ' + confirmData.items.length + ' dòng điểm thành công', type: 'success' })
      setEditedGrades({})
      if (selectedCC) { let g = await gradeService.getByCourseClass(selectedCC); setGrades(Array.isArray(g) ? g : []) }
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
    finally { setSaving(false); setConfirmData(null) }
  }

  async function handleExcelImport(e) {
    e.preventDefault()
    if (!excelFile) return
    setImporting(true)
    setToast({ message: 'Đang import điểm...', type: 'info' })
    try {
      let formData = new FormData()
      formData.append('file', excelFile)
      formData.append('courseClassId', selectedCC)
      let result = await postFormData('/upload/excel/grades', formData)
      
      if (Array.isArray(result)) {
        let successItems = result.filter(function(r) { return r.success === true })
        let errorItems = result.filter(function(r) { return r.success === false })
        
        if (errorItems.length > 0) {
          let firstError = errorItems[0]
          let errorMsg = 'Lỗi SV ' + (firstError.studentCode || 'N/A') + ': ' + (firstError.message === "khong tim thay sinh vien trong lop" ? "Không có trong lớp" : (firstError.message === "khong tim thay grade" ? "Chưa có bảng điểm gốc" : firstError.message))
          if (errorItems.length > 1) {
            errorMsg += ' (và ' + (errorItems.length - 1) + ' SV khác)'
          }
          if (successItems.length > 0) {
            setToast({ message: 'Cập nhật ' + successItems.length + ' SV. ' + errorMsg, type: 'warning' })
          } else {
            setToast({ message: 'Thất bại ' + errorItems.length + ' dòng. ' + errorMsg, type: 'error' })
          }
        } else {
          setToast({ message: 'Import thành công ' + successItems.length + ' dòng điểm', type: 'success' })
        }
      } else {
        setToast({ message: 'Có lỗi xảy ra khi đọc file', type: 'error' })
      }

      setExcelModalOpen(false)
      setExcelFile(null)
      if (selectedCC) { let g = await gradeService.getByCourseClass(selectedCC); setGrades(Array.isArray(g) ? g : []) }
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
    finally { setImporting(false) }
  }

  // === STUDENT VIEW: Group by semester ===
  function groupBySemester(gradeList) {
    let groups = {}
    gradeList.forEach(function (g) {
      let semName = g.enrollment?.courseClass?.semester?.name || 'Không xác định'
      let semId = g.enrollment?.courseClass?.semester?._id || 'unknown'
      if (!groups[semId]) groups[semId] = { name: semName, grades: [] }
      groups[semId].grades.push(g)
    })
    return Object.values(groups)
  }

  function calcGPA(gradeList) {
    let totalCredits = 0
    let totalPoints4 = 0
    let totalPoints10 = 0
    let count = 0
    gradeList.forEach(function (g) {
      if (g.averageScore === undefined || g.averageScore === null) return
      let credits = g.enrollment?.courseClass?.subject?.credits || 0
      totalCredits += credits
      totalPoints4 += toGPA4(g.averageScore) * credits
      totalPoints10 += g.averageScore * credits
      count++
    })
    return {
      totalCredits: totalCredits,
      gpa4: totalCredits > 0 ? Math.round((totalPoints4 / totalCredits) * 100) / 100 : 0,
      gpa10: totalCredits > 0 ? Math.round((totalPoints10 / totalCredits) * 100) / 100 : 0,
      count: count
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  // ===================== STUDENT VIEW =====================
  if (isStudent) {
    let semesters = groupBySemester(grades)
    let overall = calcGPA(grades)

    return (
      <div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
        <h1 className="text-2xl font-bold text-gray-800 font-display mb-6">Bảng điểm cá nhân</h1>

        {/* Overall GPA Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-card p-5 text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Tổng tín chỉ tích lũy</p>
            <p className="text-3xl font-bold text-primary">{overall.totalCredits}</p>
          </div>
          <div className="bg-white rounded-xl shadow-card p-5 text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">GPA (Hệ 4)</p>
            <p className="text-3xl font-bold text-primary">{overall.gpa4.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-card p-5 text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">GPA (Hệ 10)</p>
            <p className="text-3xl font-bold text-primary">{overall.gpa10.toFixed(2)}</p>
          </div>
        </div>

        {/* Grouped by Semester */}
        {semesters.map(function (sem, si) {
          let semGPA = calcGPA(sem.grades)
          return (
            <div key={si} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-700 font-display">{sem.name}</h2>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>TC: <strong className="text-gray-700">{semGPA.totalCredits}</strong></span>
                  <span>GPA 4: <strong className="text-gray-700">{semGPA.gpa4.toFixed(2)}</strong></span>
                  <span>GPA 10: <strong className="text-gray-700">{semGPA.gpa10.toFixed(2)}</strong></span>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Môn học</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">STC</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">CC</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">GK</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">CK</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">TB</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Điểm chữ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sem.grades.map(function (g, i) {
                      let letter = toLetterGrade(g.averageScore)
                      let credits = g.enrollment?.courseClass?.subject?.credits || '-'
                      return (
                        <tr key={g._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td>
                          <td className="px-5 py-3 text-sm font-medium text-gray-800">{g.enrollment?.courseClass?.subject?.name || 'N/A'}</td>
                          <td className="px-5 py-3 text-center text-sm text-gray-600">{credits}</td>
                          <td className="px-5 py-3 text-center text-sm">{g.attendanceScore ?? '-'}</td>
                          <td className="px-5 py-3 text-center text-sm">{g.midtermScore ?? '-'}</td>
                          <td className="px-5 py-3 text-center text-sm">{g.finalScore ?? '-'}</td>
                          <td className="px-5 py-3 text-center"><span className={`text-sm font-semibold ${g.averageScore !== undefined && g.averageScore !== null ? (g.averageScore >= 5 ? 'text-green-600' : 'text-red-500') : ''}`}>{g.averageScore?.toFixed(1) ?? '-'}</span></td>
                          <td className="px-5 py-3 text-center"><span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${letterColor(letter)}`}>{letter}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
        {grades.length === 0 && <div className="bg-white rounded-xl shadow-card px-5 py-8 text-center text-gray-400 text-sm">Không có dữ liệu bảng điểm</div>}
      </div>
    )
  }

  // ===================== TEACHER / ADMIN VIEW =====================
  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <ConfirmDialog isOpen={!!confirmData} onClose={function () { setConfirmData(null) }} onConfirm={confirmBulkSave} message={'Xác nhận cập nhật điểm cho ' + (confirmData ? confirmData.items.length : 0) + ' sinh viên?'} confirmText="Cập nhật" confirmColor="primary" />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 font-display">Quản lý Điểm</h1>
        {selectedCC && (
          <div className="flex gap-2">
            <button onClick={function () { setExcelModalOpen(true); setExcelFile(null) }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">Import Excel</button>
            <button onClick={handleBulkSave} disabled={!hasChanges || saving} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${hasChanges ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>{saving ? 'Đang lưu...' : 'Lưu tất cả'}</button>
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mr-3">Chọn lớp học phần:</label>
        <select value={selectedCC} onChange={function (e) { loadCCGrades(e.target.value) }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
          <option value="">-- Chọn --</option>
          {courseClasses.map(function (cc) { return <option key={cc._id} value={cc._id}>{cc.subject?.name} - {cc.semester?.name}</option> })}
        </select>
      </div>

      {selectedCC && (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">MSSV</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Sinh viên</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">CC (10%)</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">GK (30%)</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">CK (60%)</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">TB</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Xếp loại</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(function (g, i) {
                  let avg = getComputedAvg(g)
                  let letter = toLetterGrade(avg)
                  let isEdited = !!editedGrades[g._id]
                  return (
                    <tr key={g._id} className={`border-b border-gray-100 hover:bg-gray-50 ${isEdited ? 'bg-yellow-50/50' : ''}`}>
                      <td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td>
                      <td className="px-5 py-3 text-sm font-medium text-primary">{g.enrollment?.student?.studentCode || '-'}</td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-800">{g.enrollment?.student?.fullName || 'N/A'}</td>
                      <td className="px-5 py-3 text-center">
                        <input type="text" inputMode="decimal" value={getDisplayValue(g, 'attendanceScore')} onChange={function (e) { handleScoreChange(g._id, 'attendanceScore', e.target.value) }} onBlur={function () { handleScoreBlur(g._id, 'attendanceScore') }} className="w-16 px-2 py-1 rounded border border-gray-300 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="-" />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <input type="text" inputMode="decimal" value={getDisplayValue(g, 'midtermScore')} onChange={function (e) { handleScoreChange(g._id, 'midtermScore', e.target.value) }} onBlur={function () { handleScoreBlur(g._id, 'midtermScore') }} className="w-16 px-2 py-1 rounded border border-gray-300 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="-" />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <input type="text" inputMode="decimal" value={getDisplayValue(g, 'finalScore')} onChange={function (e) { handleScoreChange(g._id, 'finalScore', e.target.value) }} onBlur={function () { handleScoreBlur(g._id, 'finalScore') }} className="w-16 px-2 py-1 rounded border border-gray-300 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="-" />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-sm font-semibold ${avg !== undefined && avg !== null ? (avg >= 5 ? 'text-green-600' : 'text-red-500') : 'text-gray-400'}`}>{avg !== undefined && avg !== null ? avg.toFixed(1) : '-'}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${letterColor(letter)}`}>{letter}</span>
                      </td>
                    </tr>
                  )
                })}
                {grades.length === 0 && <tr><td colSpan="8" className="px-5 py-8 text-center text-gray-400 text-sm">Chọn lớp học phần để xem bảng điểm</td></tr>}
              </tbody>
            </table>
          </div>
          {grades.length > 0 && hasChanges && (
            <div className="border-t border-gray-200 bg-yellow-50 px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-yellow-700">Có {Object.keys(editedGrades).length} dòng chưa lưu</span>
              <button onClick={handleBulkSave} disabled={saving} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu tất cả'}</button>
            </div>
          )}
        </div>
      )}

      {/* Excel Import Modal */}
      <Modal isOpen={excelModalOpen} onClose={function () { setExcelModalOpen(false) }} title="Import điểm từ Excel">
        <form onSubmit={handleExcelImport}>
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-3">Chọn file Excel (.xlsx) với các cột theo thứ tự: <strong>MSSV, Điểm CC, Điểm GK, Điểm CK</strong></p>
            <input type="file" accept=".xlsx,.xls" onChange={function (e) { setExcelFile(e.target.files[0] || null) }} ref={fileInputRef} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark" required />
          </div>
          {excelFile && <p className="text-xs text-gray-500 mb-4">File đã chọn: <strong>{excelFile.name}</strong> ({(excelFile.size / 1024).toFixed(1)} KB)</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={function () { setExcelModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={importing || !excelFile} className="px-4 py-2 rounded-lg text-sm bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">{importing ? 'Đang import...' : 'Import'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
export default GradesPage
