import { useState, useEffect, useCallback } from 'react'

export function useCRUD(service) {
  let [data, setData] = useState([])
  let [loading, setLoading] = useState(true)
  let [error, setError] = useState('')

  let fetchData = useCallback(async function () {
    setLoading(true)
    try {
      let result = await service.getAll()
      setData(Array.isArray(result) ? result : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [service])

  useEffect(function () { fetchData() }, [fetchData])

  async function createItem(item) {
    let result = await service.create(item)
    setData([...data, result])
    return result
  }

  async function updateItem(id, item) {
    let result = await service.update(id, item)
    setData(data.map(function (d) { return d._id === id ? result : d }))
    return result
  }

  async function removeItem(id) {
    await service.remove(id)
    setData(data.filter(function (d) { return d._id !== id }))
  }

  return { data, loading, error, fetchData, createItem, updateItem, removeItem }
}
