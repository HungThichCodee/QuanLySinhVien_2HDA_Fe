import { get, post, put, del } from './api.js'
export let getAll = () => get('/subjects')
export let getById = (id) => get('/subjects/' + id)
export let create = (data) => post('/subjects', data)
export let update = (id, data) => put('/subjects/' + id, data)
export let remove = (id) => del('/subjects/' + id)
