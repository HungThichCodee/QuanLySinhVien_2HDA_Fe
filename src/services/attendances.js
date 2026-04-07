import { get, post, put } from './api.js'
export let getByEnrollment = (id) => get('/attendances/enrollment/' + id)
export let getByCourseClass = (id) => get('/attendances/courseclass/' + id)
export let create = (data) => post('/attendances', data)
export let createBulk = (data) => post('/attendances/bulk', data)
export let update = (id, data) => put('/attendances/' + id, data)
