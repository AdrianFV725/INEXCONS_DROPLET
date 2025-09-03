import axios from '../utils/axiosConfig';

/**
 * Servicio para manejar los prospectos
 */
const prospectoService = {
  /**
   * Obtener todos los prospectos
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  getAll: async () => {
    try {
      const response = await axios.get('/prospectos');
      return response.data;
    } catch (error) {
      console.error('Error al obtener prospectos:', error);
      throw error;
    }
  },

  /**
   * Obtener un prospecto por su ID
   * @param {number} id - ID del prospecto
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  getById: async (id) => {
    try {
      const response = await axios.get(`/prospectos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener prospecto con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crear un nuevo prospecto
   * @param {Object} prospecto - Datos del prospecto
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  create: async (prospecto) => {
    try {
      const response = await axios.post('/prospectos', prospecto);
      return response.data;
    } catch (error) {
      console.error('Error al crear prospecto:', error);
      throw error;
    }
  },

  /**
   * Actualizar un prospecto existente
   * @param {number} id - ID del prospecto
   * @param {Object} prospecto - Datos actualizados del prospecto
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  update: async (id, prospecto) => {
    try {
      const response = await axios.put(`/prospectos/${id}`, prospecto);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar prospecto con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar un prospecto
   * @param {number} id - ID del prospecto
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  delete: async (id) => {
    try {
      await axios.delete(`/prospectos/${id}`);
      return true;
    } catch (error) {
      console.error(`Error al eliminar prospecto con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de prospectos
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  getStats: async () => {
    try {
      const response = await axios.get('/prospectos/stats');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de prospectos:', error);
      throw error;
    }
  },

  /**
   * Obtener todas las notas de un prospecto
   * @param {number} prospectoId - ID del prospecto
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  getNotas: async (prospectoId) => {
    try {
      const response = await axios.get(`/prospectos/${prospectoId}/notas`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener notas del prospecto con ID ${prospectoId}:`, error);
      throw error;
    }
  },

  /**
   * Crear una nueva nota para un prospecto
   * @param {number} prospectoId - ID del prospecto
   * @param {Object} nota - Datos de la nota
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  createNota: async (prospectoId, nota) => {
    try {
      const response = await axios.post(`/prospectos/${prospectoId}/notas`, nota);
      return response.data;
    } catch (error) {
      console.error(`Error al crear nota para el prospecto con ID ${prospectoId}:`, error);
      throw error;
    }
  },

  /**
   * Actualizar una nota existente
   * @param {number} prospectoId - ID del prospecto
   * @param {number} notaId - ID de la nota
   * @param {Object} nota - Datos actualizados de la nota
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  updateNota: async (prospectoId, notaId, nota) => {
    try {
      const response = await axios.put(`/prospectos/${prospectoId}/notas/${notaId}`, nota);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar nota con ID ${notaId} del prospecto con ID ${prospectoId}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar una nota
   * @param {number} prospectoId - ID del prospecto
   * @param {number} notaId - ID de la nota
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  deleteNota: async (prospectoId, notaId) => {
    try {
      await axios.delete(`/prospectos/${prospectoId}/notas/${notaId}`);
      return true;
    } catch (error) {
      console.error(`Error al eliminar nota con ID ${notaId} del prospecto con ID ${prospectoId}:`, error);
      throw error;
    }
  },

  /**
   * Convertir un prospecto a proyecto
   * @param {number} prospectoId - ID del prospecto
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  convertToProject: async (prospectoId) => {
    try {
      const response = await axios.post(`/prospectos/${prospectoId}/convert`);
      return response.data;
    } catch (error) {
      console.error(`Error al convertir prospecto con ID ${prospectoId} a proyecto:`, error);
      throw error;
    }
  },

  /**
   * Actualizar el estado de un prospecto
   * @param {number} id - ID del prospecto
   * @param {string} status - Nuevo estado del prospecto
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  updateStatus: async (id, status) => {
    try {
      const response = await axios.put(`/prospectos/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar estado del prospecto con ID ${id}:`, error);
      throw error;
    }
  }
};

export default prospectoService; 