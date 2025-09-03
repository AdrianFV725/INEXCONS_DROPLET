import axios from '../utils/axiosConfig'

const API_URL = '/conceptos'

export const conceptoService = {
  // Obtener todos los conceptos
  getAll: async (filters = {}) => {
    let url = API_URL;
    if (filters.proyecto_id) {
      url += `?proyecto_id=${filters.proyecto_id}`;
    }
    if (filters.contratista_id) {
      url += `${url.includes('?') ? '&' : '?'}contratista_id=${filters.contratista_id}`;
    }
    const response = await axios.get(url);
    return response.data.data;
  },

  // Obtener un concepto por ID
  getById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data.data;
  },

  // Crear un nuevo concepto
  create: async (conceptoData) => {
    const response = await axios.post(API_URL, conceptoData);
    return response.data.data;
  },

  // Actualizar un concepto
  update: async (id, conceptoData) => {
    const response = await axios.put(`${API_URL}/${id}`, conceptoData);
    return response.data.data;
  },

  // Eliminar un concepto
  delete: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },

  // Obtener pagos de un concepto
  getPayments: async (id) => {
    const response = await axios.get(`${API_URL}/${id}/pagos`);
    return response.data.data;
  },

  // Agregar un pago a un concepto
  addPayment: async (id, paymentData) => {
    const response = await axios.post(`${API_URL}/${id}/pagos`, paymentData);
    return response.data.data;
  },

  // Eliminar un pago de un concepto
  deletePayment: async (conceptoId, pagoId) => {
    const response = await axios.delete(`${API_URL}/${conceptoId}/pagos/${pagoId}`);
    return response.data;
  }
} 