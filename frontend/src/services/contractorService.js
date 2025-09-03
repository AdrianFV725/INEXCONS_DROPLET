import axios from '../utils/axiosConfig'

const API_URL = '/contratistas'

export const contractorService = {
  getAll: async () => {
    const response = await axios.get(API_URL)
    return response.data
  },

  getById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`)
    return response.data
  },

  create: async (contractorData) => {
    // Si contractorData ya es un FormData, lo usamos directamente
    let formData = contractorData instanceof FormData ? contractorData : new FormData()
    
    // Si no es FormData, procesamos los datos
    if (!(contractorData instanceof FormData)) {
      // Agregar campos básicos
      Object.keys(contractorData).forEach(key => {
        if (key !== 'documentos' && key !== 'proyectos') {
          formData.append(key, contractorData[key])
        }
      })
      
      // Agregar documentos
      if (contractorData.documentos && contractorData.documentos.length > 0) {
        contractorData.documentos.forEach(doc => {
          formData.append('documentos[]', doc)
        })
      }

      // Agregar proyectos
      if (contractorData.proyectos && contractorData.proyectos.length > 0) {
        formData.append('proyectos', JSON.stringify(contractorData.proyectos))
      }
    }

    // Depuración: mostrar los datos que se van a enviar
    console.log('FormData a enviar:')
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1])
    }

    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  update: async (id, contractorData) => {
    // Si contractorData ya es un FormData, lo usamos directamente
    let formData = contractorData instanceof FormData ? contractorData : new FormData()
    
    // Si no es FormData, procesamos los datos
    if (!(contractorData instanceof FormData)) {
      // Agregar campos básicos
      Object.keys(contractorData).forEach(key => {
        if (key !== 'documentos' && key !== 'proyectos') {
          formData.append(key, contractorData[key])
        }
      })
      
      // Agregar documentos nuevos
      if (contractorData.documentos && contractorData.documentos.length > 0) {
        contractorData.documentos.forEach(doc => {
          formData.append('documentos[]', doc)
        })
      }

      // Agregar proyectos
      if (contractorData.proyectos && contractorData.proyectos.length > 0) {
        formData.append('proyectos', JSON.stringify(contractorData.proyectos))
      }
    }

    // Depuración: mostrar los datos que se van a enviar
    console.log('FormData a enviar (update):')
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1])
    }

    const response = await axios.post(`${API_URL}/${id}?_method=PUT`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  delete: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`)
    return response.data
  },

  assignToProject: async (contractorId, projectId) => {
    const response = await axios.post(
      `${API_URL}/${contractorId}/proyectos/${projectId}`
    )
    return response.data
  },

  removeFromProject: async (contractorId, projectId) => {
    const response = await axios.delete(
      `${API_URL}/${contractorId}/proyectos/${projectId}`
    )
    return response.data
  },

  deleteDocument: async (contractorId, documentId) => {
    const response = await axios.delete(
      `${API_URL}/${contractorId}/documentos/${documentId}`
    )
    return response.data
  },

  // Nuevos métodos para conceptos
  getConceptos: async (contractorId) => {
    const response = await axios.get(`${API_URL}/${contractorId}/conceptos`)
    return response.data.data
  },

  getConceptosByProyecto: async (contractorId, proyectoId) => {
    const response = await axios.get(`${API_URL}/${contractorId}/proyectos/${proyectoId}/conceptos`)
    return response.data.data
  },

  createConcepto: async (contractorId, proyectoId, conceptoData) => {
    const response = await axios.post(
      `${API_URL}/${contractorId}/proyectos/${proyectoId}/conceptos`,
      conceptoData
    )
    return response.data.data
  },

  getDashboard: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}/dashboard`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener dashboard del contratista:', error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      console.log('Solicitando estadísticas de contratistas...');
      const response = await axios.get(`${API_URL}/stats`);
      console.log('Respuesta de estadísticas de contratistas:', response.data);
      
      // Verificar si hay datos válidos
      if (!response.data) {
        console.warn('No se recibieron datos de estadísticas');
        return {
          total: 0,
          totalConceptos: 0,
          totalPagado: 0,
          error: 'No se recibieron datos'
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        total: 0,
        totalConceptos: 0,
        totalPagado: 0,
        error: error.message
      };
    }
  }
} 