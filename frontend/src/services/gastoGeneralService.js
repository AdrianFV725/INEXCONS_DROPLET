import axios from '../utils/axiosConfig'

const API_URL = '/gastos-generales'
const API_URL_INEX = '/gastos-inex'

export const gastoGeneralService = {
  getAll: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(`${API_URL_INEX}${queryParams ? `?${queryParams}` : ''}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener gastos INEX:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener gasto general con ID ${id}:`, error);
      throw error;
    }
  },

  create: async (gastoData) => {
    try {
      const response = await axios.post(API_URL_INEX, gastoData);
      return response.data;
    } catch (error) {
      console.error('Error al crear gasto INEX:', error);
      throw error;
    }
  },

  update: async (id, gastoData) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, gastoData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar gasto general con ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_URL_INEX}/${id}`);
      return {
        success: true,
        message: 'Gasto INEX eliminado correctamente',
        data: response.data
      };
    } catch (error) {
      console.error(`Error al eliminar gasto INEX con ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar el gasto INEX'
      };
    }
  },

  getStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de gastos generales:', error);
      return {
        total_gastos: 0,
        monto_total_gastos: 0,
        gastos_por_mes: [],
        monto_total_proyectos: 0,
        total_pagos: 0,
        total_gastos_contratistas: 0,
        operativos: 0,
        administrativos: 0,
        otros: 0,
        gastos_inex: 0,
        gastos_proyectos: 0,
        saldo_pendiente: 0,
        balance_final: 0
      };
    }
  },

  // Funciones para gastos generales de proyectos
  getGastos: async (proyectoId) => {
    try {
      const response = await axios.get(`/proyectos/${proyectoId}/gastos-generales`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener gastos generales del proyecto ${proyectoId}:`, error);
      throw error;
    }
  },

  addGasto: async (proyectoId, gastoData) => {
    try {
      const response = await axios.post(`/proyectos/${proyectoId}/gastos-generales`, {
        ...gastoData,
        proyecto_id: proyectoId
      });
      return response.data;
    } catch (error) {
      console.error(`Error al agregar gasto general al proyecto ${proyectoId}:`, error);
      throw error;
    }
  },

  deleteGasto: async (proyectoId, gastoId) => {
    try {
      const response = await axios.delete(`/proyectos/${proyectoId}/gastos-generales/${gastoId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar gasto general ${gastoId} del proyecto ${proyectoId}:`, error);
      throw error;
    }
  }
} 