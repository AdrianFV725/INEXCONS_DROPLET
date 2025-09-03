import axios from '../utils/axiosConfig';

const API_URL = '/prospectos-historial';

/**
 * Servicio para manejar el historial de prospectos
 */
const prospectoHistorialService = {
  /**
   * Obtener todos los prospectos del historial
   * @param {Object} filtros - Filtros para la consulta
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  getAll: async (filtros = {}) => {
    try {
      // Construir los parámetros de consulta
      const params = new URLSearchParams();
      
      if (filtros.fecha_inicio && filtros.fecha_fin) {
        params.append('fecha_inicio', filtros.fecha_inicio);
        params.append('fecha_fin', filtros.fecha_fin);
      }
      
      if (filtros.busqueda) {
        params.append('busqueda', filtros.busqueda);
      }
      
      if (filtros.estado && filtros.estado !== 'todos') {
        params.append('estado', filtros.estado);
      }
      
      const url = `${API_URL}?${params.toString()}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial de prospectos:', error);
      throw error;
    }
  },

  /**
   * Obtener un prospecto del historial por su ID
   * @param {number} id - ID del prospecto
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener prospecto del historial con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas del historial de prospectos
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  getStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas del historial de prospectos:', error);
      // En caso de error, devolver valores por defecto
      return {
        total_prospectos: 0,
        monto_total_no_atendidos: 0,
        por_estado: {
          pendiente: 0,
          en_seguimiento: 0,
          convertido: 0,
          cancelado: 0
        }
      };
    }
  },

  /**
   * Eliminar un prospecto del historial
   * @param {number} id - ID del prospecto
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar prospecto del historial con ID ${id}:`, error);
      throw error;
    }
  }
};

export default prospectoHistorialService; 