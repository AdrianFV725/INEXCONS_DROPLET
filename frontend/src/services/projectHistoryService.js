import axios from '../utils/axiosConfig'

const API_URL = '/proyectos-historial'

export const projectHistoryService = {
  getAll: async (filters = {}) => {
    try {
      // Construir los parámetros de consulta
      const params = new URLSearchParams();
      
      if (filters.fecha_inicio && filters.fecha_fin) {
        params.append('fecha_inicio', filters.fecha_inicio);
        params.append('fecha_fin', filters.fecha_fin);
      }
      
      if (filters.trabajador_id) {
        params.append('trabajador_id', filters.trabajador_id);
      }
      
      if (filters.nombre) {
        params.append('nombre', filters.nombre);
      }
      
      const url = `${API_URL}?${params.toString()}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial de proyectos:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener proyecto con ID ${id}:`, error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de historial:', error);
      // En caso de error, devolver valores por defecto
      return {
        proyectos_por_mes: [],
        total_proyectos: 0,
        monto_total: 0
      };
    }
  },

  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar proyecto del historial con ID ${id}:`, error);
      throw error;
    }
  }
} 