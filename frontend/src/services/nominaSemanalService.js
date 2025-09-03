import axios from '../utils/axiosConfig';

/**
 * Servicio para gestionar nóminas semanales
 */
const nominaSemanalService = {
  /**
   * Obtener todas las nóminas semanales de un año específico
   * @param {number} anio - Año para filtrar (opcional, por defecto el año actual)
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  getAll: async (anio = new Date().getFullYear()) => {
    try {
      const response = await axios.get(`/nomina-semanal?anio=${anio}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener nóminas semanales:', error);
      throw error;
    }
  },

  /**
   * Obtener una nómina semanal por ID con sus pagos
   * @param {number} id - ID de la nómina semanal
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  getById: async (id) => {
    try {
      const response = await axios.get(`/nomina-semanal/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener nómina semanal con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Actualizar una nómina semanal
   * @param {number} id - ID de la nómina semanal
   * @param {Object} data - Datos a actualizar
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  update: async (id, data) => {
    try {
      const response = await axios.put(`/nomina-semanal/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar nómina semanal con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Generar todas las semanas para un año específico
   * @param {number} anio - Año para el que generar las semanas
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  generarSemanas: async (anio) => {
    try {
      const response = await axios.post('/nomina-semanal/generar-semanas', { anio });
      return response.data;
    } catch (error) {
      console.error(`Error al generar semanas para el año ${anio}:`, error);
      throw error;
    }
  },

  /**
   * Obtener información de la semana actual
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  getSemanaActual: async () => {
    try {
      const response = await axios.get('/nomina-semanal/semana-actual');
      return response.data;
    } catch (error) {
      console.error('Error al obtener información de la semana actual:', error);
      throw error;
    }
  },

  /**
   * Comprobar si ha cambiado la semana actual y devolver la nueva semana
   * @param {Object} semanaActualPrevia - La semana actual que se tenía previamente
   * @returns {Promise<Object|null>} - La nueva semana actual si ha cambiado, o null si no ha cambiado
   */
  verificarCambioSemanaActual: async (semanaActualPrevia) => {
    try {
      // Si no hay semana previa, obtener la actual
      if (!semanaActualPrevia) {
        return await nominaSemanalService.getSemanaActual();
      }
      
      // Obtener la semana actual del servidor
      const nuevaSemanaActual = await nominaSemanalService.getSemanaActual();
      
      // Comprobar si ha cambiado
      if (nuevaSemanaActual && semanaActualPrevia.id !== nuevaSemanaActual.id) {
        return nuevaSemanaActual;
      }
      
      // No ha cambiado
      return null;
    } catch (error) {
      console.error('Error al verificar cambio de semana actual:', error);
      return null;
    }
  },
  
  /**
   * Obtener datos completos actualizados (semana actual y nóminas del año)
   * @param {number} anio - Año para el que obtener los datos
   * @returns {Promise<Object>} - Objeto con la semana actual y las nóminas del año
   */
  getDatosActualizados: async (anio = new Date().getFullYear()) => {
    try {
      // Obtener semana actual
      const semanaActual = await nominaSemanalService.getSemanaActual();
      
      // Obtener nóminas del año
      const nominas = await nominaSemanalService.getAll(anio);
      
      return {
        semanaActual,
        nominas: Array.isArray(nominas) ? nominas : []
      };
    } catch (error) {
      console.error('Error al obtener datos actualizados:', error);
      throw error;
    }
  },

  /**
   * Obtener los años disponibles con nóminas
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  getAniosDisponibles: async () => {
    try {
      const response = await axios.get('/nomina-semanal/anios-disponibles');
      return response.data;
    } catch (error) {
      console.error('Error al obtener años disponibles:', error);
      throw error;
    }
  },

  /**
   * Eliminar todas las semanas de un año específico
   * @param {number} anio - Año para eliminar
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  eliminarAnio: async (anio) => {
    try {
      // Intentar primero con POST (más compatible con proxies y CORS)
      try {
        const response = await axios.post('/nomina-semanal/eliminar-anio', { anio });
        return response.data;
      } catch (postError) {
        console.warn('Error con POST, intentando con DELETE:', postError);
        // Si POST falla, intentar con DELETE
        const response = await axios.delete('/nomina-semanal/eliminar-anio', {
          data: { anio } // En DELETE, los parámetros van en data
        });
        return response.data;
      }
    } catch (error) {
      console.error(`Error al eliminar semanas del año ${anio}:`, error);
      
      // Extraer mensaje de error más específico
      let errorMsg = 'Error desconocido';
      if (error.response) {
        // El servidor respondió con un código de error
        if (error.response.data && error.response.data.error) {
          errorMsg = error.response.data.error;
        } else if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        } else {
          errorMsg = `Error ${error.response.status}: ${error.response.statusText}`;
        }
      } else if (error.request) {
        // No se recibió respuesta
        errorMsg = 'No se recibió respuesta del servidor';
      } else {
        // Error en la configuración de la solicitud
        errorMsg = error.message;
      }
      
      throw new Error(errorMsg);
    }
  },

  /**
   * Obtener pagos de una nómina semanal
   * @param {number} nominaId - ID de la nómina semanal
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  getPagos: async (nominaId) => {
    try {
      const response = await axios.get(`/nomina-semanal/${nominaId}/pagos`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener pagos de la nómina semanal con ID ${nominaId}:`, error);
      throw error;
    }
  },

  /**
   * Crear un nuevo pago en una nómina semanal
   * @param {number} nominaId - ID de la nómina semanal
   * @param {Object} pago - Datos del pago
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  createPago: async (nominaId, pago) => {
    try {
      const response = await axios.post(`/nomina-semanal/${nominaId}/pagos`, pago);
      return response.data;
    } catch (error) {
      console.error(`Error al crear pago en la nómina semanal con ID ${nominaId}:`, error);
      throw error;
    }
  },

  /**
   * Actualizar un pago existente
   * @param {number} nominaId - ID de la nómina semanal
   * @param {number} pagoId - ID del pago
   * @param {Object} pago - Datos actualizados del pago
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  updatePago: async (nominaId, pagoId, pago) => {
    try {
      const response = await axios.put(`/nomina-semanal/${nominaId}/pagos/${pagoId}`, pago);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar pago con ID ${pagoId}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar un pago
   * @param {number} nominaId - ID de la nómina semanal
   * @param {number} pagoId - ID del pago
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  deletePago: async (nominaId, pagoId) => {
    try {
      await axios.delete(`/nomina-semanal/${nominaId}/pagos/${pagoId}`);
      return true;
    } catch (error) {
      console.error(`Error al eliminar pago con ID ${pagoId}:`, error);
      throw error;
    }
  },

  /**
   * Cambiar el estado de un pago (pendiente/pagado)
   * @param {number} nominaId - ID de la nómina semanal
   * @param {number} pagoId - ID del pago
   * @param {string} estado - Nuevo estado ('pendiente' o 'pagado')
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  cambiarEstadoPago: async (nominaId, pagoId, estado) => {
    try {
      const response = await axios.put(`/nomina-semanal/${nominaId}/pagos/${pagoId}/estado`, { estado });
      return response.data;
    } catch (error) {
      console.error(`Error al cambiar estado del pago con ID ${pagoId}:`, error);
      throw error;
    }
  },

  /**
   * Obtener trabajadores para el selector de pagos
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  getTrabajadores: async () => {
    try {
      const response = await axios.get('/trabajadores-nomina');
      return response.data;
    } catch (error) {
      console.error('Error al obtener trabajadores:', error);
      throw error;
    }
  }
};

export default nominaSemanalService; 