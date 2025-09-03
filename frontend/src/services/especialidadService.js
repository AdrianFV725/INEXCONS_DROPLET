import axios from '../utils/axiosConfig'

const getAll = async () => {
  try {
    const response = await axios.get('/especialidades')
    return response.data
  } catch (error) {
    console.error('Error al obtener especialidades:', error)
    throw error
  }
}

const getById = async (id) => {
  try {
    const response = await axios.get(`/especialidades/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error al obtener especialidad ${id}:`, error)
    throw error
  }
}

const create = async (especialidad) => {
  try {
    const response = await axios.post('/especialidades', especialidad)
    return response.data
  } catch (error) {
    console.error('Error al crear especialidad:', error)
    throw error
  }
}

const update = async (id, especialidad) => {
  try {
    const response = await axios.put(`/especialidades/${id}`, especialidad)
    return response.data
  } catch (error) {
    console.error(`Error al actualizar especialidad ${id}:`, error)
    throw error
  }
}

const remove = async (id) => {
  try {
    await axios.delete(`/especialidades/${id}`)
    return true
  } catch (error) {
    console.error(`Error al eliminar especialidad ${id}:`, error)
    throw error
  }
}

export const especialidadService = {
  getAll,
  getById,
  create,
  update,
  remove,
} 