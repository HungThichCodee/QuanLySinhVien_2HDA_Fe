import { get, post, put, del } from './api.js'
export let getAll = () => get('/students')
export let search = (keyword) => get('/students?keyword=' + encodeURIComponent(keyword))
export let getById = (id) => get('/students/' + id)
export let create = (data) => post('/students', data)
export let update = (id, data) => put('/students/' + id, data)
export let remove = (id) => del('/students/' + id)
export let getTrash = () => get('/students/trash')
export let restore = (id) => put('/students/' + id + '/restore', {})
