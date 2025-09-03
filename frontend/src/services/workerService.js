import axios from '../utils/axiosConfig'

const API_URL = '/trabajadores'

export const workerService = {
  getAll: async () => {
    const response = await axios.get(API_URL)
    return response.data
  },

  getById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`)
    return response.data
  },

  create: async (workerData) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
      const response = await axios.post(API_URL, workerData, config)
      return response.data
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        console.error('Validation errors:', error.response.data.errors)
        throw new Error(Object.values(error.response.data.errors).flat().join(', '))
      }
      throw error
    }
  },

  update: async (id, workerData) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
      const response = await axios.post(`${API_URL}/${id}?_method=PUT`, workerData, config)
      return response.data
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        console.error('Validation errors:', error.response.data.errors)
        throw new Error(Object.values(error.response.data.errors).flat().join(', '))
      }
      throw error
    }
  },

  delete: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`)
    return response.data
  },

  getStats: async () => {
    const response = await axios.get(`${API_URL}/stats`)
    return response.data
  },

  assignToProject: async (workerId, projectId, data = {}) => {
    try {
      const response = await axios.post(
        `${API_URL}/${workerId}/proyectos`,
        {
          proyecto_id: projectId,
          ...data
        }
      )
      return response.data
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        console.error('Validation errors:', error.response.data.errors)
        throw new Error(Object.values(error.response.data.errors).flat().join(', '))
      }
      throw error
    }
  },

  removeFromProject: async (workerId, projectId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/${workerId}/proyectos`,
        {
          data: { proyecto_id: projectId }
        }
      )
      return response.data
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        console.error('Validation errors:', error.response.data.errors)
        throw new Error(Object.values(error.response.data.errors).flat().join(', '))
      }
      throw error
    }
  },
  
  // Métodos para pagos extras
  registerPayment: async (workerId, paymentData) => {
    try {
      const response = await axios.post(
        `${API_URL}/${workerId}/pagos`,
        paymentData
      )
      return response.data
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        console.error('Validation errors:', error.response.data.errors)
        throw new Error(Object.values(error.response.data.errors).flat().join(', '))
      }
      throw error
    }
  },
  
  getPayments: async (workerId) => {
    const response = await axios.get(`${API_URL}/${workerId}/pagos`)
    return response.data
  },
  
  deletePayment: async (workerId, paymentId) => {
    try {
      const response = await axios.delete(`${API_URL}/${workerId}/pagos/${paymentId}`)
      return response.data
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        console.error('Validation errors:', error.response.data.errors)
        throw new Error(Object.values(error.response.data.errors).flat().join(', '))
      }
      throw error
    }
  }
} 