import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  UserIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  EyeIcon,
  TagIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import prospectoService from '../../services/prospectoService';
import { formatDate, formatCurrency } from '../../utils/formatters';

export default function ProspectosPage() {
  const navigate = useNavigate();
  const [prospectos, setProspectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    en_seguimiento: 0,
    convertidos: 0,
    cancelados: 0
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [prospectoToDelete, setProspectoToDelete] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [prospectoToConvert, setProspectoToConvert] = useState(null);
  const [convertingToProject, setConvertingToProject] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Cargar prospectos y estadísticas
  const loadProspectos = async () => {
    try {
      const data = await prospectoService.getAll();
      setProspectos(data);

      // Calcular estadísticas
      const estadisticas = data.reduce((acc, prospecto) => {
        acc.total++;
        switch (prospecto.estado) {
          case 'pendiente':
            acc.pendientes++;
            break;
          case 'en_seguimiento':
            acc.en_seguimiento++;
            break;
          case 'convertido':
            acc.convertidos++;
            break;
          case 'cancelado':
            acc.cancelados++;
            break;
        }
        return acc;
      }, {
        total: 0,
        pendientes: 0,
        en_seguimiento: 0,
        convertidos: 0,
        cancelados: 0
      });

      setStats(estadisticas);
      setError(null);
    } catch (err) {
      console.error('Error al cargar prospectos:', err);
      setError('Error al cargar los prospectos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
      // Activar animaciones después de cargar los datos
      setTimeout(() => setIsVisible(true), 100);
    }
  };

  useEffect(() => {
    loadProspectos();
  }, []);

  // Función para obtener la etiqueta y clase de estado
  const getEstadoLabel = (estado) => {
    const estados = {
      pendiente: { text: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' },
      en_seguimiento: { text: 'En Seguimiento', class: 'bg-blue-100 text-blue-800' },
      convertido: { text: 'Convertido', class: 'bg-green-100 text-green-800' },
      cancelado: { text: 'Cancelado', class: 'bg-red-100 text-red-800' }
    };

    return estados[estado] || { text: estado, class: 'bg-gray-100 text-gray-800' };
  };

  // Manejar eliminación de prospecto
  const handleDeleteClick = (prospecto) => {
    setProspectoToDelete(prospecto);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await prospectoService.delete(prospectoToDelete.id);
      setShowDeleteModal(false);
      setProspectoToDelete(null);
      loadProspectos();
      setSuccessMessage('Prospecto eliminado exitosamente');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Error al eliminar prospecto:', err);
      setError('Error al eliminar el prospecto. Por favor, intenta de nuevo.');
    }
  };

  const handleEstadoChange = async (prospectoId, nuevoEstado) => {
    try {
      setLoadingStates(prev => ({ ...prev, [prospectoId]: true }));
      await prospectoService.updateStatus(prospectoId, nuevoEstado);
      await loadProspectos();
      setOpenDropdown(null);
      setSuccessMessage(`Estado actualizado a "${getEstadoLabel(nuevoEstado).text}" correctamente`);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setError('Error al actualizar el estado del prospecto. Por favor, intenta de nuevo.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [prospectoId]: false }));
    }
  };

  // Manejar conversión a proyecto
  const handleConvertToProject = async () => {
    try {
      setConvertingToProject(true);
      const result = await prospectoService.convertToProject(prospectoToConvert.id);
      setShowConvertModal(false);
      setSuccessMessage('Prospecto convertido a proyecto exitosamente');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      navigate(`/admin/proyectos/${result.projectId}`);
    } catch (err) {
      console.error('Error al convertir prospecto a proyecto:', err);
      setError('Error al convertir el prospecto a proyecto. Por favor, intenta de nuevo.');
    } finally {
      setConvertingToProject(false);
      setProspectoToConvert(null);
    }
  };

  const handleOpenConvertModal = (prospecto) => {
    setProspectoToConvert(prospecto);
    setShowConvertModal(true);
  };

  const handleCloseConvertModal = () => {
    setShowConvertModal(false);
    setProspectoToConvert(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado con animación */}
      <div className={`sm:flex sm:items-center transform transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Prospectos</h1>
          <p className="mt-2 text-sm text-gray-700">
            Lista de todos los prospectos y su estado actual
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/prospectos/historial')}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <ClipboardDocumentListIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
            Historial
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/prospectos/nuevo')}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Nuevo Prospecto
          </button>
        </div>
      </div>

      {/* Mensaje de éxito con animación */}
      {showSuccessMessage && (
        <div className={`mt-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-md transform transition-all duration-500 delay-100 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}>
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Mensaje de error con animación */}
      {error && (
        <div className={`mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md transform transition-all duration-500 delay-100 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Estadísticas con animación */}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6 transform transition-all duration-500 delay-200 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        {/* Total Prospectos */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Prospectos</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.pendientes}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* En Seguimiento */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowRightIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">En Seguimiento</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.en_seguimiento}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Convertidos */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Convertidos</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.convertidos}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Cancelados */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cancelados</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.cancelados}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de prospectos con animación */}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 transform transition-all duration-500 delay-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        {prospectos.map((prospecto, index) => (
          <div
            key={prospecto.id}
            className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-all duration-500 transform ${
              isVisible 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-4 scale-95'
            }`}
            style={{ transitionDelay: `${400 + index * 100}ms` }}
            onClick={() => navigate(`/admin/prospectos/${prospecto.id}`)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                    <DocumentTextIcon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{prospecto.nombre}</h3>
                    {prospecto.descripcion && (
                      <p className="text-sm text-gray-500 line-clamp-2">{prospecto.descripcion}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <UserIcon className="h-5 w-5 mr-2" />
                  {prospecto.cliente || 'Sin cliente'}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  {prospecto.ubicacion || 'Sin ubicación'}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                  {prospecto.presupuesto_estimado ? formatCurrency(prospecto.presupuesto_estimado) : 'Sin presupuesto'}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  {prospecto.fecha_estimada_inicio ? formatDate(prospecto.fecha_estimada_inicio) : 'Sin fecha'}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="relative inline-block text-left">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === prospecto.id ? null : prospecto.id);
                      }}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer ${getEstadoLabel(prospecto.estado).class
                        }`}
                    >
                      <span>{getEstadoLabel(prospecto.estado).text}</span>
                      <ChevronDownIcon className="h-4 w-4 ml-1" aria-hidden="true" />
                    </div>
                    {openDropdown === prospecto.id && (
                      <div
                        className="absolute left-0 z-50 mt-1 w-48 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                        style={{
                          bottom: 'calc(100% + 0.5rem)',
                          left: '0'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEstadoChange(prospecto.id, 'pendiente');
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${prospecto.estado === 'pendiente' ? 'bg-gray-50 text-indigo-600' : 'text-gray-700'
                              }`}
                          >
                            Pendiente
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEstadoChange(prospecto.id, 'en_seguimiento');
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${prospecto.estado === 'en_seguimiento' ? 'bg-gray-50 text-indigo-600' : 'text-gray-700'
                              }`}
                          >
                            En Seguimiento
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEstadoChange(prospecto.id, 'convertido');
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${prospecto.estado === 'convertido' ? 'bg-gray-50 text-indigo-600' : 'text-gray-700'
                              }`}
                          >
                            Convertido
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEstadoChange(prospecto.id, 'cancelado');
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${prospecto.estado === 'cancelado' ? 'bg-gray-50 text-indigo-600' : 'text-gray-700'
                              }`}
                          >
                            Cancelado
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/prospectos/editar/${prospecto.id}`);
                      }}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PencilIcon className="h-3 w-3 mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProspectoToDelete(prospecto);
                        setShowDeleteModal(true);
                      }}
                      className="inline-flex items-center px-2 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-3 w-3 mr-1" />
                      Eliminar
                    </button>
                  </div>
                </div>
                
                {prospecto.estado === 'convertido' && (
                  <div className="flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenConvertModal(prospecto);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full justify-center"
                    >
                      <ArrowRightIcon className="h-4 w-4 mr-2" />
                      Convertir a Proyecto
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Eliminar Prospecto
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas eliminar este prospecto? Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleConfirmDelete}
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de conversión a proyecto */}
      {showConvertModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Convertir a Proyecto
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas convertir este prospecto en un proyecto? Esta acción creará un nuevo proyecto con la información del prospecto.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleConvertToProject}
                  disabled={convertingToProject}
                >
                  {convertingToProject ? 'Convirtiendo...' : 'Convertir'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCloseConvertModal}
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