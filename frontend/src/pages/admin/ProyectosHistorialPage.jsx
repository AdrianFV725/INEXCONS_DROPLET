import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaEye, FaCalendarAlt, FaUser, FaFilter, FaTimes, FaInfoCircle, FaTrash } from 'react-icons/fa';
import { CalendarIcon, CurrencyDollarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { projectHistoryService } from '../../services/projectHistoryService';
import { workerService } from '../../services/workerService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ProyectosHistorialPage = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trabajadores, setTrabajadores] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    trabajador_id: '',
    nombre: ''
  });

  // Estadísticas
  const [stats, setStats] = useState({
    total_proyectos: 0,
    monto_total: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar estadísticas primero
        const statsData = await projectHistoryService.getStats();
        setStats(statsData);
        
        // Cargar proyectos
        const data = await projectHistoryService.getAll();
        setProyectos(data);
        
        // Cargar trabajadores para el filtro
        const trabajadoresData = await workerService.getAll();
        setTrabajadores(trabajadoresData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar el historial de proyectos: ' + err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectHistoryService.getAll(filters);
      setProyectos(data);
      setLoading(false);
    } catch (err) {
      console.error('Error al aplicar filtros:', err);
      setError('Error al aplicar filtros: ' + err.message);
      setLoading(false);
    }
  };

  const clearFilters = async () => {
    setFilters({
      fecha_inicio: '',
      fecha_fin: '',
      trabajador_id: '',
      nombre: ''
    });
    
    try {
      setLoading(true);
      setError(null);
      const data = await projectHistoryService.getAll();
      setProyectos(data);
      setLoading(false);
    } catch (err) {
      console.error('Error al limpiar filtros:', err);
      setError('Error al limpiar filtros: ' + err.message);
      setLoading(false);
    }
  };

  const handleVerDetalle = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const proyecto = await projectHistoryService.getById(id);
      setSelectedProyecto(proyecto);
      setShowModal(true);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar detalles:', err);
      setError('Error al cargar detalles del proyecto: ' + err.message);
      setLoading(false);
    }
  };

  const handleOpenDeleteModal = (proyecto) => {
    setProjectToDelete(proyecto);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const confirmDelete = async () => {
    try {
      await projectHistoryService.delete(projectToDelete.id);
      setProyectos(proyectos.filter(p => p.id !== projectToDelete.id));
      handleCloseDeleteModal();
    } catch (err) {
      console.error('Error al eliminar el proyecto del historial:', err);
      setError('Error al eliminar el proyecto del historial: ' + err.message);
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
          <h1 className="text-2xl font-semibold text-gray-900">Historial de Proyectos</h1>
          <p className="mt-1 text-sm text-gray-700">
            Proyectos eliminados del sistema
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white shadow-sm rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 mr-4">
              <CalendarIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Total Proyectos Eliminados</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total_proyectos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Monto Total</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.monto_total)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 border-b border-gray-200 flex flex-wrap justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Historial de Proyectos
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <label htmlFor="trabajador_id" className="block text-sm font-medium text-gray-700 mb-1">
                  <FaUser className="inline mr-1" /> Trabajador
                </label>
                <select
                  id="trabajador_id"
                  name="trabajador_id"
                  value={filters.trabajador_id}
                  onChange={handleFilterChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">Todos los trabajadores</option>
                  {trabajadores.map(trabajador => (
                    <option key={trabajador.id} value={trabajador.id}>
                      {trabajador.nombre} {trabajador.apellidos}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  <FaSearch className="inline mr-1" /> Nombre del Proyecto
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={filters.nombre}
                  onChange={handleFilterChange}
                  placeholder="Buscar por nombre..."
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
          {proyectos.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {proyectos.map(proyecto => (
                <div key={proyecto.id} className="p-4">
                  <div className="block">
                    <h3 className="text-lg font-medium text-gray-900">{proyecto.nombre}</h3>
                    
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Monto: {formatCurrency(proyecto.montoTotal)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Eliminado: {formatDate(proyecto.fecha_eliminacion)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex space-x-3">
                      <button
                        onClick={() => handleVerDetalle(proyecto.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaEye className="mr-1" /> Ver Detalles
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(proyecto)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <FaTrash className="mr-1" /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                <FaInfoCircle className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-500">
                No hay proyectos eliminados en el historial. Cuando elimines un proyecto, aparecerá aquí.
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
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Eliminación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proyectos.length > 0 ? (
                proyectos.map(proyecto => (
                  <tr key={proyecto.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {proyecto.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(proyecto.montoTotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(proyecto.fecha_eliminacion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleVerDetalle(proyecto.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaEye className="mr-1" /> Ver Detalles
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(proyecto)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ml-2"
                      >
                        <FaTrash className="mr-1" /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                      <FaInfoCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-500 block">
                      No hay proyectos eliminados en el historial. Cuando elimines un proyecto, aparecerá aquí.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full max-w-[95%] mx-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                {selectedProyecto && (
                  <>
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                          {selectedProyecto.nombre}
                        </h3>
                        
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Monto Total:</p>
                              <p className="text-base font-medium">{formatCurrency(selectedProyecto.montoTotal)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">IVA:</p>
                              <p className="text-base font-medium">{formatCurrency(selectedProyecto.iva)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Anticipo:</p>
                              <p className="text-base font-medium">{formatCurrency(selectedProyecto.anticipo)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Fecha Eliminación:</p>
                              <p className="text-base font-medium">{formatDate(selectedProyecto.fecha_eliminacion)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Fecha Inicio:</p>
                              <p className="text-base font-medium">{formatDate(selectedProyecto.fechaInicio)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Fecha Finalización:</p>
                              <p className="text-base font-medium">{formatDate(selectedProyecto.fechaFinalizacion)}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h4 className="text-md font-medium text-gray-900 mb-2">Contratistas</h4>
                          {selectedProyecto.contratistas && JSON.parse(selectedProyecto.contratistas).length > 0 ? (
                            <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidad</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {JSON.parse(selectedProyecto.contratistas).map((contratista, index) => (
                                    <tr key={index}>
                                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{contratista.nombre}</td>
                                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{contratista.especialidad}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No hay contratistas asociados</p>
                          )}
                        </div>
                        
                        <div className="mt-6">
                          <h4 className="text-md font-medium text-gray-900 mb-2">Trabajadores</h4>
                          {selectedProyecto.trabajadores && JSON.parse(selectedProyecto.trabajadores).length > 0 ? (
                            <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sueldo</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {JSON.parse(selectedProyecto.trabajadores).map((trabajador, index) => (
                                    <tr key={index}>
                                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{trabajador.nombre} {trabajador.apellidos}</td>
                                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(trabajador.sueldo_base)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No hay trabajadores asociados</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar proyecto */}
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
                      Eliminar proyecto
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de eliminar el proyecto "{projectToDelete?.nombre}"? Esta acción no se puede deshacer y eliminará todos los datos asociados.
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

export default ProyectosHistorialPage; 