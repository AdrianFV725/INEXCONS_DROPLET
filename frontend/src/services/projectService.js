import axios from '../utils/axiosConfig'

const API_URL = '/proyectos'

// Función auxiliar para obtener los headers con el token de autenticación
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export const projectService = {
  getAll: async () => {
    const response = await axios.get(API_URL)
    return response.data
  },

  getById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`)
    return response.data
  },

  create: async (projectData) => {
    const response = await axios.post(API_URL, projectData)
    return response.data
  },

  update: async (id, projectData) => {
    // Asegurarnos de que enviamos los datos en formato JSON correcto
    const response = await axios.put(`${API_URL}/${id}`, JSON.stringify(projectData), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  },

  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`)
      return response.data
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      // Propagar un error más descriptivo
      throw new Error(error.message || 'Error en el servidor al intentar eliminar el proyecto');
    }
  },

  getStats: async () => {
    const response = await axios.get(`${API_URL}/stats`)
    return response.data
  },

  addPayment: async (projectId, paymentData) => {
    // Crear un objeto simple con todos los datos necesarios
    const dataToSend = {
      proyecto_id: projectId,
      monto: paymentData.monto,
      fecha: paymentData.fecha,
      descripcion: paymentData.descripcion || '',
      tipo: paymentData.tipo || 'cliente'
    };

    console.log('Enviando datos de pago al servidor (JSON):', dataToSend);

    // Enviar como JSON con headers explícitos
    const response = await axios.post(
      `${API_URL}/${projectId}/pagos`,
      dataToSend,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    return response.data;
  },

  deleteDocument: async (projectId, documentId) => {
    const response = await axios.delete(
      `${API_URL}/${projectId}/documentos/${documentId}`
    )
    return response.data
  },

  updateContractors: async (projectId, contratistas) => {
    try {
      const response = await axios.put(`${API_URL}/${projectId}/contratistas`,
        JSON.stringify({ contratistas: contratistas }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error al actualizar contratistas:', error)
      throw error
    }
  },

  // Nuevos métodos para conceptos
  getConceptos: async (projectId) => {
    const response = await axios.get(`${API_URL}/${projectId}/conceptos`)
    return response.data.data
  },

  getContratistasWithConceptos: async (projectId) => {
    const response = await axios.get(`${API_URL}/${projectId}/contratistas-conceptos`)
    return response.data.data
  },

  getConceptosByContratista: async (projectId, contratistaId) => {
    const response = await axios.get(`${API_URL}/${projectId}/contratistas/${contratistaId}/conceptos`)
    return response.data.data
  },

  createConcepto: async (projectId, contratistaId, conceptoData) => {
    const response = await axios.post(
      `${API_URL}/${projectId}/contratistas/${contratistaId}/conceptos`,
      conceptoData
    )
    return response.data.data
  }
} 