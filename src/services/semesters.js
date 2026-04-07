import { get, post, put, del } from './api.js'
export let getAll = () => get('/semesters')
export let getById = (id) => get('/semesters/' + id)
export let create = (data) => post('/semesters', data)
export let update = (id, data) => put('/semesters/' + id, data)
export let remove = (id) => del('/semesters/' + id)
