import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import * as service from '../services/courseclasses.js'
import * as semesterService from '../services/semesters.js'
import * as subjectService from '../services/subjects.js'
import * as teacherService from '../services/teachers.js'
import Modal from '../components/ui/Modal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Toast from '../components/ui/Toast.jsx'

let DAY_LABELS = { 2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7' }

function formatSchedule(schedule) {
  if (!schedule || !schedule.dayOfWeek) return ''
  return DAY_LABELS[schedule.dayOfWeek] + ' - Tiết ' + schedule.startPeriod + '-' + schedule.endPeriod
}

function formatSemester(semester) {
  if (!semester) return ''
  if (!semester.startDate || !semester.endDate) return semester.name || ''
  let start = new Date(semester.startDate)
  let end = new Date(semester.endDate)
  let startStr = start.getDate().toString().padStart(2, '0') + '/' + (start.getMonth() + 1).toString().padStart(2, '0') + '/' + start.getFullYear()
  let endStr = end.getDate().toString().padStart(2, '0') + '/' + (end.getMonth() + 1).toString().padStart(2, '0') + '/' + end.getFullYear()
  return semester.name + ' (' + startStr + ' - ' + endStr + ')'
}

function CourseClassesPage() {
  let { isAdmin, isTeacher } = useAuth()
  let [data, setData] = useState([])
  let [semesters, setSemesters] = useState([])
  let [subjects, setSubjects] = useState([])
  let [teachers, setTeachers] = useState([])
  let [modalOpen, setModalOpen] = useState(false)
  let [form, setForm] = useState({ semester: '', subject: '', teacher: '', maxStudents: 40, room: '', schedule: { dayOfWeek: '', startPeriod: '', endPeriod: '' } })
  let [confirmId, setConfirmId] = useState(null)
  let [editId, setEditId] = useState(null)
  let [toast, setToast] = useState(null)
  let [loading, setLoading] = useState(true)
  let [availableSlots, setAvailableSlots] = useState([])
  let [availableRooms, setAvailableRooms] = useState([])
  let [searchKeyword, setSearchKeyword] = useState('')
  let [displayData, setDisplayData] = useState(null)
  let [detailItem, setDetailItem] = useState(null)
  let [detailModalOpen, setDetailModalOpen] = useState(false)
  let [filterSemester, setFilterSemester] = useState('')
  let [filterTeacher, setFilterTeacher] = useState('')

  async function loadData(semId, teachId) {
    let parts = []
    if (semId) parts.push('semester=' + semId)
    if (teachId) parts.push('teacher=' + teachId)
    let query = parts.join('&')
    let result = await service.getAll(query)
    setData(Array.isArray(result) ? result : [])
    setDisplayData(null)
    setSearchKeyword('')
  }

  useEffect(function () {
    async function init() {
      try {
        let result = isTeacher ? await service.getMyTeaching() : await service.getAll()
        setData(Array.isArray(result) ? result : [])
        if (isAdmin) {
          let [s, sub, t] = await Promise.all([semesterService.getAll(), subjectService.getAll(), teacherService.getAll()])
          setSemesters(s)
          setSubjects(sub)
          setTeachers(t)
        }
      } catch (err) { console.log(err) }
      setLoading(false)
    }
    init()
  }, [isAdmin, isTeacher])

  useEffect(function () {
    if (!searchKeyword.trim()) { setDisplayData(null); return }
    let timer = setTimeout(async function () {
      try {
        let result = await service.search(searchKeyword)
        setDisplayData(Array.isArray(result) ? result : [])
      } catch (err) { setToast({ message: err.message, type: 'error' }) }
    }, 400)
    return function () { clearTimeout(timer) }
  }, [searchKeyword])

  async function openDetail(item) {
    try {
      let result = await service.getById(item._id)
      setDetailItem(result)
      setDetailModalOpen(true)
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }
  useEffect(function () {
    if (form.semester && form.teacher) {
      service.getAvailableSlots(form.semester, form.teacher).then(function (slots) {
        setAvailableSlots(slots)
      }).catch(function () { setAvailableSlots([]) })
    } else {
      setAvailableSlots([])
    }
  }, [form.semester, form.teacher])

  useEffect(function () {
    if (form.semester && form.schedule.dayOfWeek && form.schedule.startPeriod && form.schedule.endPeriod) {
      service.getAvailableRooms(form.semester, form.schedule.dayOfWeek, form.schedule.startPeriod, form.schedule.endPeriod).then(function (rooms) {
        setAvailableRooms(rooms)
      }).catch(function () { setAvailableRooms([]) })
    } else {
      setAvailableRooms([])
    }
  }, [form.semester, form.schedule.dayOfWeek, form.schedule.startPeriod, form.schedule.endPeriod])

  function openCreate() {
    setEditId(null)
    setForm({ semester: '', subject: '', teacher: '', maxStudents: 40, room: '', schedule: { dayOfWeek: '', startPeriod: '', endPeriod: '' } })
    setModalOpen(true)
  }

  function openEdit(item) {
    setEditId(item._id)
    setForm({
      semester: item.semester?._id || '',
      subject: item.subject?._id || '',
      teacher: item.teacher?._id || '',
      maxStudents: item.maxStudents || 40,
      room: item.room || '',
      schedule: item.schedule || { dayOfWeek: '', startPeriod: '', endPeriod: '' }
    })
    setModalOpen(true)
  }

  function handleSlotChange(e) {
    let val = e.target.value
    if (!val) {
      setForm({ ...form, room: '', schedule: { dayOfWeek: '', startPeriod: '', endPeriod: '' } })
      return
    }
    let parts = val.split('-')
    setForm({ ...form, room: '', schedule: { dayOfWeek: parseInt(parts[0]), startPeriod: parseInt(parts[1]), endPeriod: parseInt(parts[2]) } })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editId) {
        let updated = await service.update(editId, form)
        setData(data.map(function (d) { return d._id === editId ? updated : d }))
        setToast({ message: 'Cập nhật thành công', type: 'success' })
      } else {
        let result = await service.create(form)
        setData([...data, result])
        setToast({ message: 'Tạo thành công', type: 'success' })
      }
      setModalOpen(false)
      setEditId(null)
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    }
  }

  async function handleDelete() {
    try {
      await service.remove(confirmId)
      setData(data.filter(function (d) { return d._id !== confirmId }))
      setConfirmId(null)
      setToast({ message: 'Xóa thành công', type: 'success' })
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    }
  }

  let currentSlotValue = form.schedule.dayOfWeek ? form.schedule.dayOfWeek + '-' + form.schedule.startPeriod + '-' + form.schedule.endPeriod : ''
  let listData = displayData !== null ? displayData : data

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}


      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800 font-display">{isTeacher ? 'Lớp học phần của tôi' : 'Quản lý Lớp học phần'}</h1>
        {isAdmin && <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">+ Thêm LHP</button>}
      </div>

      {isAdmin && (
        <div className="flex flex-wrap gap-2 mb-5">
          <input type="text" value={searchKeyword} onChange={function (e) { setSearchKeyword(e.target.value) }} placeholder="Tìm theo tên môn học..." className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-52" />
          <select value={filterSemester} onChange={function (e) { let v = e.target.value; setFilterSemester(v); loadData(v, filterTeacher) }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
            <option value="">-- Tất cả học kỳ --</option>
            {semesters.map(function (s) { return <option key={s._id} value={s._id}>{s.name}</option> })}
          </select>
          <select value={filterTeacher} onChange={function (e) { let v = e.target.value; setFilterTeacher(v); loadData(filterSemester, v) }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
            <option value="">-- Tất cả giáo viên --</option>
            {teachers.map(function (t) { return <option key={t._id} value={t._id}>{t.fullName}</option> })}
          </select>
          {(filterSemester || filterTeacher) && (
            <button onClick={function () { setFilterSemester(''); setFilterTeacher(''); loadData('', '') }} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-100 transition-colors">✕ Bỏ lọc</button>
          )}
        </div>
      )}


      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Môn học</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Học kỳ</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">GV</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Lịch học</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Phòng</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">SS</th>
              {isAdmin && <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tác</th>}
            </tr>
            {searchKeyword && isAdmin && <tr><td colSpan="8" className="px-5 py-1.5 text-xs text-gray-400 bg-gray-50">Kết quả tìm kiếm cho "{searchKeyword}"</td></tr>}
          </thead>
          <tbody>
            {listData.map(function (item, i) {
              return (
                <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{item.subject?.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatSemester(item.semester)}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{item.teacher?.fullName || item.teacher?.user?.fullName}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatSchedule(item.schedule)}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{item.room}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{item.currentStudents || 0}/{item.maxStudents}</td>
                  {isAdmin && (
                    <td className="px-5 py-3 text-right">
                      <button onClick={function () { openDetail(item) }} className="text-gray-500 hover:underline text-sm mr-3">Xem</button>
                      <button onClick={function () { openEdit(item) }} className="text-primary hover:underline text-sm mr-3">Sửa</button>
                      <button onClick={function () { setConfirmId(item._id) }} className="text-red-500 hover:underline text-sm">Xóa</button>
                    </td>
                  )}
                </tr>
              )
            })}
            {listData.length === 0 && (
              <tr><td colSpan="8" className="px-5 py-8 text-center text-gray-400 text-sm">{searchKeyword ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={function () { setModalOpen(false) }} title={editId ? "Sửa Lớp học phần" : "Thêm Lớp học phần"}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Học kỳ</label>
            <select value={form.semester} onChange={function (e) { setForm({ ...form, semester: e.target.value, schedule: { dayOfWeek: '', startPeriod: '', endPeriod: '' }, room: '' }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required>
              <option value="">-- Chọn --</option>
              {semesters.map(function (s) { return <option key={s._id} value={s._id}>{s.name}</option> })}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Môn học</label>
            <select value={form.subject} onChange={function (e) { setForm({ ...form, subject: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required>
              <option value="">-- Chọn --</option>
              {subjects.map(function (s) { return <option key={s._id} value={s._id}>{s.name}</option> })}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Giáo viên</label>
            <select value={form.teacher} onChange={function (e) { setForm({ ...form, teacher: e.target.value, schedule: { dayOfWeek: '', startPeriod: '', endPeriod: '' }, room: '' }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required>
              <option value="">-- Chọn --</option>
              {teachers.map(function (t) { return <option key={t._id} value={t._id}>{t.fullName}</option> })}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lịch học</label>
            {(!form.semester || !form.teacher) ? (
              <p className="text-xs text-gray-400 italic">Vui lòng chọn Học kỳ và Giáo viên trước</p>
            ) : (
              <select value={currentSlotValue} onChange={handleSlotChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required>
                <option value="">-- Chọn ca học --</option>
                {availableSlots.map(function (slot) {
                  let val = slot.dayOfWeek + '-' + slot.startPeriod + '-' + slot.endPeriod
                  let label = DAY_LABELS[slot.dayOfWeek] + ' - Tiết ' + slot.startPeriod + '-' + slot.endPeriod
                  return <option key={val} value={val}>{label}</option>
                })}
              </select>
            )}
            {form.semester && form.teacher && availableSlots.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Giáo viên đã kín lịch trong học kỳ này</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sĩ số tối đa</label>
              <input type="number" value={form.maxStudents} onChange={function (e) { setForm({ ...form, maxStudents: parseInt(e.target.value) || 1 }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" min="1" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phòng học</label>
              {(!form.schedule.dayOfWeek) ? (
                <p className="text-xs text-gray-400 italic mt-2">Chọn lịch học trước</p>
              ) : (
                <select value={form.room} onChange={function (e) { setForm({ ...form, room: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required>
                  <option value="">-- Chọn phòng --</option>
                  {availableRooms.map(function (r) { return <option key={r} value={r}>{r}</option> })}
                </select>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={function () { setModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Hủy</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-primary text-white font-semibold hover:bg-primary-dark">{editId ? "Cập nhật" : "Tạo mới"}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!confirmId} onClose={function () { setConfirmId(null) }} onConfirm={handleDelete} />
      <Modal isOpen={detailModalOpen} onClose={function () { setDetailModalOpen(false) }} title="Chi tiết Lớp học phần">
        {detailItem && (
          <div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Môn học</span><p className="mt-1 text-sm text-gray-800 font-medium">{detailItem.subject?.name}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Mã môn</span><p className="mt-1 text-sm text-primary font-mono">{detailItem.subject?.subjectCode || '—'}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Học kỳ</span><p className="mt-1 text-sm text-gray-600">{formatSemester(detailItem.semester)}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Giáo viên</span><p className="mt-1 text-sm text-gray-600">{detailItem.teacher?.fullName || detailItem.teacher?.user?.fullName || '—'}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Lịch học</span><p className="mt-1 text-sm text-gray-600">{formatSchedule(detailItem.schedule) || '—'}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Phòng học</span><p className="mt-1 text-sm text-gray-600">{detailItem.room || '—'}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Sĩ số</span><p className="mt-1 text-sm text-gray-600">{detailItem.currentStudents || 0} / {detailItem.maxStudents}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">ID</span><p className="mt-1 text-xs text-gray-400 font-mono">{detailItem._id}</p></div>
            <div className="flex justify-end mt-4"><button onClick={function () { setDetailModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Đóng</button></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
export default CourseClassesPage
