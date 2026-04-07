import { get, put } from './api.js'
export let getByEnrollment = (id) => get('/grades/enrollment/' + id)
export let getByCourseClass = (id) => get('/grades/courseclass/' + id)
export let getMyGrades = () => get('/grades/my')
export let update = (id, data) => put('/grades/' + id, data)
