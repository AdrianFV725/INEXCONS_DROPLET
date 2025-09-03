import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrashIcon, 
  ArrowPathIcon,
  CalendarIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import prospectoHistorialService from '../../services/prospectoHistorialService';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function ProspectosHistorialPage() {
  const [prospectos, setProspectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [prospectoToDelete, setProspectoToDelete] = useState(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'todos',
    busqueda: ''
  });

  // Estadísticas
  const [stats, setStats] = useState({
    total_prospectos: 0,
    monto_total_no_atendidos: 0,
    por_estado: {
      pendiente: 0,
      en_seguimiento: 0,
      convertido: 0,
      cancelado: 0
    }
  });

  useEffect(() => {
    loadProspectos();
  }, []);

  const loadProspectos = async (filtrosAplicados = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar estadísticas primero
      const statsData = await prospectoHistorialService.getStats();
      setStats(statsData);
      
      // Cargar prospectos con filtros
      const filtrosActuales = { ...filters, ...filtrosAplicados };
      const data = await prospectoHistorialService.getAll(filtrosActuales);
      setProspectos(data);
    } catch (err) {
      console.error('Error al cargar historial de prospectos:', err);
      setError('Error al cargar el historial de prospectos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    loadProspectos(filters);
    setShowFilters(false);
  };

  const resetFilters = () => {
    const resetedFilters = {
      fecha_inicio: '',
      fecha_fin: '',
      estado: 'todos',
      busqueda: ''
    };
    setFilters(resetedFilters);
    loadProspectos(resetedFilters);
    setShowFilters(false);
  };

  const confirmDelete = (prospecto) => {
    setProspectoToDelete(prospecto);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!prospectoToDelete) return;
    
    try {
      await prospectoHistorialService.delete(prospectoToDelete.id);
      loadProspectos();
      setShowDeleteModal(false);
      setProspectoToDelete(null);
    } catch (err) {
      console.error('Error al eliminar prospecto del historial:', err);
      setError('Error al eliminar el prospecto del historial. Por favor, intenta de nuevo.');
    }
  };

  // Obtener etiqueta de estado
  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'pendiente':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>;
      case 'en_seguimiento':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">En seguimiento</span>;
      case 'convertido':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Convertido</span>;
      case 'cancelado':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Cancelado</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Desconocido</span>;
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Historial de Prospectos</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => loadProspectos()}
            className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1 sm:mr-2" />
            Actualizar
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-1 sm:mr-2" />
            Filtros
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-full bg-blue-100 text-blue-600">
              <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Total de prospectos eliminados</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">{stats.total_prospectos}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-full bg-green-100 text-green-600">
              <CurrencyDollarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Monto total no atendido</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">{formatCurrency(stats.monto_total_no_atendidos)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-full bg-red-100 text-red-600">
              <ExclamationTriangleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Proyección de facturación perdida</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">{formatCurrency(stats.monto_total_no_atendidos)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">Filtros</h2>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <label htmlFor="fecha_inicio" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                id="fecha_inicio"
                name="fecha_inicio"
                value={filters.fecha_inicio}
                onChange={handleFilterChange}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="fecha_fin" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                id="fecha_fin"
                name="fecha_fin"
                value={filters.fecha_fin}
                onChange={handleFilterChange}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="estado" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                value={filters.estado}
                onChange={handleFilterChange}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_seguimiento">En seguimiento</option>
                <option value="convertido">Convertido</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="busqueda" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Búsqueda
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="busqueda"
                  name="busqueda"
                  value={filters.busqueda}
                  onChange={handleFilterChange}
                  placeholder="Nombre o cliente"
                  className="w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={resetFilters}
              className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Limpiar
            </button>
            <button
              onClick={applyFilters}
              className="px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de prospectos */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {loading ? (
          <div className="p-4 sm:p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-xs sm:text-sm text-gray-500">Cargando historial de prospectos...</p>
          </div>
        ) : error ? (
          <div className="p-4 sm:p-6 text-center">
            <p className="text-red-500 text-xs sm:text-sm">{error}</p>
            <button
              onClick={() => loadProspectos()}
              className="mt-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs sm:text-sm"
            >
              Reintentar
            </button>
          </div>
        ) : prospectos.length === 0 ? (
          <div className="p-4 sm:p-6 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">No hay prospectos en el historial.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th scope="col" className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Presupuesto
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha eliminación
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prospectos.map((prospecto) => (
                  <tr key={prospecto.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">{prospecto.nombre}</div>
                      <div className="sm:hidden text-xs text-gray-500 mt-1">
                        {prospecto.cliente || '-'}
                      </div>
                      <div className="sm:hidden text-xs text-gray-500 mt-1">
                        {formatDate(prospecto.fecha_eliminacion)}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-500">{prospecto.cliente || '-'}</div>
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900">{formatCurrency(prospecto.presupuesto_estimado)}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      {getEstadoLabel(prospecto.estado)}
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-500">{formatDate(prospecto.fecha_eliminacion)}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <button
                        onClick={() => confirmDelete(prospecto)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
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
                      Eliminar prospecto del historial
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de eliminar permanentemente el prospecto "{prospectoToDelete?.nombre}" del historial? Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProspectoToDelete(null);
                  }}
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
} 