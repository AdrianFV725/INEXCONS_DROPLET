import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusIcon, PhoneIcon, BriefcaseIcon, TrashIcon, ExclamationTriangleIcon, EyeIcon, PencilIcon, CalendarIcon, CurrencyDollarIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { workerService } from '../../services/workerService'

const TrabajadoresPage = () => {
  const [workers, setWorkers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [workerToDelete, setWorkerToDelete] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    if (!amount) return 'No disponible';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  useEffect(() => {
    loadWorkers()
    // Activar animaciones después de cargar los datos
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  const loadWorkers = async () => {
    try {
      const data = await workerService.getAll()
      setWorkers(data)
      setError(null)
    } catch (err) {
      setError('Error al cargar los trabajadores')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (worker) => {
    setWorkerToDelete(worker)
    setShowDeleteModal(true)
  }

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
    setWorkerToDelete(null)
  }

  const confirmDeleteWorker = async () => {
    if (!workerToDelete) return

    try {
      await workerService.delete(workerToDelete.id)
      setWorkers(workers.filter(worker => worker.id !== workerToDelete.id))
      setShowDeleteModal(false)
      setWorkerToDelete(null)
    } catch (err) {
      setError('Error al eliminar el trabajador')
      console.error('Error:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="px-2 sm:px-4">
      {/* Header con animación */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 transform transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Trabajadores</h1>
          <p className="mt-1 text-sm text-gray-700">
            Lista de todos los trabajadores registrados
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/trabajadores/nuevo"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Nuevo Trabajador
          </Link>
        </div>
      </div>

      {error && (
        <div className={`bg-red-50 border-l-4 border-red-400 p-4 mb-4 transform transition-all duration-500 delay-100 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {/* Vista de tarjetas */}
        <div className="p-4">
          {workers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workers.map((worker, index) => (
                <div
                  key={worker.id}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-500 transform ${
                    isVisible 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-4 scale-95'
                  }`}
                  style={{ transitionDelay: `${200 + index * 100}ms` }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {worker.nombre} {worker.apellidos}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          RFC: <span className="uppercase">{worker.rfc || 'No disponible'}</span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/admin/trabajadores/editar/${worker.id}`}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-full"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(worker)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div 
                      className="mt-4 grid grid-cols-2 gap-4 cursor-pointer"
                      onClick={() => navigate(`/admin/trabajadores/${worker.id}`)}
                    >
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {worker.telefono || 'No disponible'}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <BriefcaseIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {worker.proyectos?.length || 0} proyectos
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(worker.fecha_contratacion)}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {formatCurrency(worker.sueldo_base)}
                      </div>
                    </div>

                    {worker.proyectos && worker.proyectos.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Proyectos Asignados</h4>
                        <div className="flex flex-wrap gap-2">
                          {worker.proyectos.slice(0, 3).map((proyecto) => (
                            <span
                              key={proyecto.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {proyecto.nombre}
                            </span>
                          ))}
                          {worker.proyectos.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{worker.proyectos.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 transform transition-all duration-500 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}>
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay trabajadores</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza agregando un nuevo trabajador.</p>
              <div className="mt-6">
                <Link
                  to="/admin/trabajadores/nuevo"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Nuevo Trabajador
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para eliminar trabajador */}
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
                      Eliminar trabajador
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de eliminar al trabajador "{workerToDelete?.nombre}"? Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDeleteWorker}
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
  )
}

export default TrabajadoresPage 