import React, { useEffect, useState } from 'react';
import { gastoGeneralService } from '../../services/gastoGeneralService';
import { 
  PlusIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon, 
  TrashIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { FaSearch, FaCalendarAlt, FaFilter, FaTimes } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatters';

const GastosGeneralesPage = () => {
  const [gastos, setGastos] = useState([]);
  const [stats, setStats] = useState({
    total_gastos: 0,
    monto_total_gastos: 0,
    gastos_por_mes: [],
    monto_total_proyectos: 0,
    total_pagos: 0,
    saldo_pendiente: 0,
    balance_final: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gastoToDelete, setGastoToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado para el formulario de nuevo gasto
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'operativo' // Valor por defecto
  });
  
  // Estado para filtros
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    descripcion: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar gastos con filtros si existen
      const data = await gastoGeneralService.getAll(filters);
      setGastos(data);
      
      // Cargar estadísticas
      const statsData = await gastoGeneralService.getStats();
      setStats(statsData);
      
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + (err.message || 'Error desconocido'));
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    fetchData();
  };

  const clearFilters = () => {
    setFilters({
      fecha_inicio: '',
      fecha_fin: '',
      descripcion: ''
    });
    
    // Recargar datos sin filtros
    gastoGeneralService.getAll().then(data => {
      setGastos(data);
    }).catch(err => {
      setError('Error al limpiar filtros: ' + (err.message || 'Error desconocido'));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validar datos
      if (!formData.descripcion || !formData.monto || !formData.fecha || !formData.tipo) {
        setError('Todos los campos son obligatorios');
        return;
      }
      
      // Crear nuevo gasto
      await gastoGeneralService.create({
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        fecha: formData.fecha,
        tipo: formData.tipo
      });
      
      // Limpiar formulario
      setFormData({
        descripcion: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'operativo'
      });
      
      // Ocultar formulario
      setShowForm(false);
      
      // Recargar datos
      fetchData();
    } catch (err) {
      console.error('Error al crear gasto:', err);
      setError('Error al crear gasto: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleOpenDeleteModal = (gasto) => {
    setGastoToDelete(gasto);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setGastoToDelete(null);
  };

  const confirmDelete = async () => {
    try {
      const response = await gastoGeneralService.delete(gastoToDelete.id);
      
      if (response.success) {
        // Actualizar lista de gastos
        setGastos(gastos.filter(g => g.id !== gastoToDelete.id));
        
        // Cerrar modal
        handleCloseDeleteModal();
        
        // Recargar estadísticas
        const statsData = await gastoGeneralService.getStats();
        setStats(statsData);
      } else {
        setError(response.message || 'Error al eliminar el gasto');
      }
    } catch (err) {
      console.error('Error al eliminar gasto:', err);
      setError('Error al eliminar gasto: ' + (err.message || 'Error desconocido'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gastos INEX</h1>
          <p className="mt-1 text-sm text-gray-700">
            Gestión de gastos generales de la empresa
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Nuevo Gasto
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow-sm rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 mr-4">
              <CurrencyDollarIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Monto Total Proyectos</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.monto_total_proyectos)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 mr-4">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Total Gastos</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.monto_total_gastos)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Balance Actual</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.balance_final)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario para agregar gasto */}
      {showForm && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Nuevo Gasto
            </h3>
          </div>
          <div className="px-4 py-5">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                    <DocumentTextIcon className="inline h-4 w-4 mr-1" /> Descripción
                  </label>
                  <input
                    type="text"
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Descripción del gasto"
                  />
                </div>
                <div>
                  <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-1">
                    <CurrencyDollarIcon className="inline h-4 w-4 mr-1" /> Monto
                  </label>
                  <input
                    type="number"
                    id="monto"
                    name="monto"
                    value={formData.monto}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
                    <CalendarIcon className="inline h-4 w-4 mr-1" /> Fecha
                  </label>
                  <input
                    type="date"
                    id="fecha"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
                    <DocumentTextIcon className="inline h-4 w-4 mr-1" /> Tipo de Gasto
                  </label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="operativo">Operativo</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de gastos */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 border-b border-gray-200 flex flex-wrap justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Lista de Gastos
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-2 sm:mt-0 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showFilters ? (
              <>
                <FaTimes className="mr-2" /> Ocultar Filtros
              </>
            ) : (
              <>
                <FaFilter className="mr-2" /> Mostrar Filtros
              </>
            )}
          </button>
        </div>
        
        {showFilters && (
          <div className="px-4 py-5 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700 mb-1">
                  <FaCalendarAlt className="inline mr-1" /> Fecha Inicio
                </label>
                <input
                  type="date"
                  id="fecha_inicio"
                  name="fecha_inicio"
                  value={filters.fecha_inicio}
                  onChange={handleFilterChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="fecha_fin" className="block text-sm font-medium text-gray-700 mb-1">
                  <FaCalendarAlt className="inline mr-1" /> Fecha Fin
                </label>
                <input
                  type="date"
                  id="fecha_fin"
                  name="fecha_fin"
                  value={filters.fecha_fin}
                  onChange={handleFilterChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                  <FaSearch className="inline mr-1" /> Descripción
                </label>
                <input
                  type="text"
                  id="descripcion"
                  name="descripcion"
                  value={filters.descripcion}
                  onChange={handleFilterChange}
                  placeholder="Buscar por descripción..."
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Limpiar Filtros
              </button>
              <button
                onClick={applyFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}
        
        {/* Versión móvil: Lista de tarjetas */}
        <div className="block sm:hidden">
          {gastos.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {gastos.map(gasto => (
                <div key={gasto.id} className="p-4">
                  <div className="block">
                    <h3 className="text-lg font-medium text-gray-900">{gasto.descripcion}</h3>
                    
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Monto: {formatCurrency(gasto.monto)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Fecha: {new Date(gasto.fecha).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <button
                        onClick={() => handleOpenDeleteModal(gasto)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">
                No hay gastos registrados. Haz clic en "Nuevo Gasto" para agregar uno.
              </p>
            </div>
          )}
        </div>

        {/* Versión desktop: Tabla */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gastos.length > 0 ? (
                gastos.map(gasto => (
                  <tr key={gasto.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {gasto.descripcion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(gasto.monto)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(gasto.fecha).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenDeleteModal(gasto)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center">
                    <p className="text-sm text-gray-500">
                      No hay gastos registrados. Haz clic en "Nuevo Gasto" para agregar uno.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmación para eliminar gasto */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full max-w-[95%] mx-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Eliminar gasto
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  onClick={handleCloseDeleteModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GastosGeneralesPage; 