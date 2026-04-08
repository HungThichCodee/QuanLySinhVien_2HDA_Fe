import { get, post, put, del } from './api.js'
export let getAll = () => get('/departments')
export let search = (name) => get('/departments?name=' + encodeURIComponent(name))
export let getById = (id) => get('/departments/' + id)
export let create = (data) => post('/departments', data)
export let update = (id, data) => put('/departments/' + id, data)
export let remove = (id) => del('/departments/' + id)
export let getTrash = () => get('/departments/trash')
export let restore = (id) => put('/departments/' + id + '/restore', {})
