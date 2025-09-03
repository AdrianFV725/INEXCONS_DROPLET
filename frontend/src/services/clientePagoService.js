import axios from '../utils/axiosConfig'

const API_URL = '/proyectos'

export const clientePagoService = {
  // Agregar un pago del cliente a un proyecto
  addPago: async (proyectoId, pagoData) => {
    try {
      // Asegurarse de que los datos estén en el formato correcto
      const dataToSend = {
        monto: parseFloat(pagoData.monto),
        fecha: pagoData.fecha,
        descripcion: pagoData.descripcion || '',
        tipo: 'cliente'
      };
      
      console.log('ClientePagoService - Enviando datos:', dataToSend);
      
      // Hacer la petición al endpoint específico para pagos del cliente
      const response = await axios.post(
        `${API_URL}/${proyectoId}/pagos-cliente`,
        dataToSend,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error en clientePagoService.addPago:', error);
      throw error;
    }
  },
  
  // Obtener todos los pagos del cliente para un proyecto
  getPagos: async (proyectoId) => {
    try {
      const response = await axios.get(`${API_URL}/${proyectoId}/pagos-cliente`);
      return response.data;
    } catch (error) {
      console.error('Error en clientePagoService.getPagos:', error);
      throw error;
    }
  },

  // Eliminar un pago del cliente
  deletePago: async (proyectoId, pagoId) => {
    try {
      const response = await axios.delete(`${API_URL}/${proyectoId}/pagos-cliente/${pagoId}`);
      return response.data;
    } catch (error) {
      console.error('Error en clientePagoService.deletePago:', error);
      throw error;
    }
  }
};

export default clientePagoService; 