import { get, post } from './api.js'
export let getMyEnrollments = () => get('/enrollments')
export let getByCourseClass = (id) => get('/enrollments/courseclass/' + id)
export let register = (courseClassId) => post('/enrollments/register', { courseClassId })
export let cancel = (courseClassId) => post('/enrollments/cancel', { courseClassId })
