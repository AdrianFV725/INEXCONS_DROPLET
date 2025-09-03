import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusIcon, CalendarIcon, CurrencyDollarIcon, ExclamationTriangleIcon, TrashIcon, EyeIcon, PencilIcon, MapPinIcon, TagIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { projectService } from '../../services/projectService'
import { formatDate } from '../../utils/formatters'

const ProyectosPage = () => {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadProjects()
    // Activar animaciones después de cargar los datos
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  const loadProjects = async () => {
    try {
      const response = await projectService.getAll()
      // Verificar si response.data existe y es un array
      const data = Array.isArray(response) ? response : [];
      console.log('Datos recibidos de proyectos:', data);

      // Asegurarse de que todos los valores numéricos sean números válidos
      const processedData = data.map(project => {
        // Asegurarse de que project.pagos sea un array
        const pagosArray = Array.isArray(project.pagos) ? project.pagos : [];
        const trabajadoresArray = Array.isArray(project.trabajadores) ? project.trabajadores : [];
        const contratistasArray = Array.isArray(project.contratistas) ? project.contratistas : [];

        // Filtrar solo los pagos de tipo 'cliente'
        const clientePagos = pagosArray.filter(pago => pago.tipo === 'cliente');

        console.log(`Proyecto ${project.nombre}:`, {
          pagos_totales: pagosArray.length,
          pagos_cliente: clientePagos.length,
          trabajadores: trabajadoresArray.length,
          contratistas: contratistasArray.length
        });

        return {
          ...project,
          montoTotal: parseFloat(project.montoTotal || 0),
          iva: parseFloat(project.iva || 0),
          anticipo: parseFloat(project.anticipo || 0),
          // Usar solo los pagos de tipo 'cliente'
          pagos: clientePagos.map(pago => ({
            ...pago,
            monto: parseFloat(pago.monto || 0)
          })),
          trabajadores: trabajadoresArray,
          contratistas: contratistasArray
        };
      });

      console.log('Datos procesados de proyectos:', processedData);
      setProjects(processedData);
      setError(null);
    } catch (err) {
      setError('Error al cargar los proyectos');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const formatCurrency = (amount) => {
    // Asegurarse de que amount sea un número
    const numAmount = typeof amount === 'number' ? amount : 0;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(numAmount)
  }

  const calculateBalance = (project) => {
    if (!project || !project.pagos) return 0;
    // Calcular el monto total con IVA
    const totalWithIVA = project.montoTotal + project.iva;
    // Calcular el total pagado
    const totalPaid = project.pagos.reduce((sum, pago) => sum + (parseFloat(pago.monto) || 0), 0);
    // El saldo pendiente es el monto total con IVA menos lo pagado
    return totalWithIVA - totalPaid;
  }

  // Calcular totales de manera segura
  const calculateTotals = () => {
    if (!projects || projects.length === 0) {
      return {
        montoTotal: 0,
        iva: 0,
        totalConIva: 0,
        pagosRealizados: 0,
        saldoPendiente: 0,
        porcentajePagado: 0,
        porcentajePendiente: 0
      };
    }

    const montoTotal = projects.reduce((sum, project) => sum + (parseFloat(project.montoTotal) || 0), 0);
    const iva = projects.reduce((sum, project) => sum + (parseFloat(project.iva) || 0), 0);
    const totalConIva = montoTotal + iva;

    // Asegurarse de que los pagos se estén sumando correctamente
    const pagosRealizados = projects.reduce((sum, project) => {
      if (!project.pagos) return sum;

      const pagosProyecto = project.pagos.reduce((pSum, pago) => {
        const montoNumerico = parseFloat(pago.monto) || 0;
        return pSum + montoNumerico;
      }, 0);

      console.log(`Pagos del proyecto ${project.nombre}: ${pagosProyecto} (${project.pagos.length} pagos)`);
      return sum + pagosProyecto;
    }, 0);

    // El saldo pendiente ahora es el total con IVA menos los pagos realizados
    const saldoPendiente = totalConIva - pagosRealizados;

    // Calcular porcentajes
    const porcentajePagado = totalConIva > 0 ? (pagosRealizados / totalConIva) * 100 : 0;
    const porcentajePendiente = totalConIva > 0 ? (saldoPendiente / totalConIva) * 100 : 0;

    console.log('Resumen financiero calculado:', {
      montoTotal,
      iva,
      totalConIva,
      pagosRealizados,
      saldoPendiente,
      porcentajePagado,
      porcentajePendiente
    });

    return {
      montoTotal,
      iva,
      totalConIva,
      pagosRealizados,
      saldoPendiente,
      porcentajePagado,
      porcentajePendiente
    };
  }

  const totals = calculateTotals();

  const handleOpenDeleteModal = (project) => {
    setProjectToDelete(project)
    setShowDeleteModal(true)
  }

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
    setProjectToDelete(null)
  }

  const confirmDelete = async () => {
    try {
      await projectService.delete(projectToDelete.id)
      loadProjects()
      handleCloseDeleteModal()
    } catch (err) {
      // Mejorar el manejo de errores para mostrar un mensaje más descriptivo
      const errorMessage = err.message || 'Error en el servidor. Contacta al administrador.';
      setError(`Error al eliminar el proyecto: ${errorMessage}`)
      console.error('Error:', err)
      handleCloseDeleteModal()
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
    <div className="px-3 sm:px-4 pb-10">
      {/* Header con animación */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 transform transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Proyectos</h1>
          <p className="mt-1 text-sm text-gray-700">
            Lista de todos los proyectos registrados
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Link
            to="/admin/proyectos-historial"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <CalendarIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Ver Historial
          </Link>
          <Link
            to="/admin/proyectos/nuevo"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Nuevo Proyecto
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

      {/* Resumen Financiero con animación */}
      <div className={`mt-8 mb-10 transform transition-all duration-500 delay-200 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Resumen Financiero</h2>
        <div className="bg-white shadow-sm rounded-lg overflow-hidden p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 uppercase">Total Facturación</h3>
              <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(totals.totalConIva)}</p>
              <div className="mt-1 flex items-center text-sm">
                <span className="text-gray-500">Sin IVA: {formatCurrency(totals.montoTotal)}</span>
              </div>
              <div className="mt-1 flex items-center text-sm">
                <span className="text-gray-500">IVA: {formatCurrency(totals.iva)}</span>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 uppercase">Pagos Recibidos</h3>
              <p className="mt-2 text-xl font-semibold text-green-700">{formatCurrency(totals.pagosRealizados)}</p>
              <div className="mt-1 flex items-center text-sm">
                <span className="text-gray-500">{totals.porcentajePagado.toFixed(1)}% del total</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.min(totals.porcentajePagado, 100)}%` }}></div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 uppercase">Saldo Pendiente</h3>
              <p className="mt-2 text-xl font-semibold text-red-700">{formatCurrency(totals.saldoPendiente)}</p>
              <div className="mt-1 flex items-center text-sm">
                <span className="text-gray-500">{totals.porcentajePendiente.toFixed(1)}% del total</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${Math.min(totals.porcentajePendiente, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Título de la sección de proyectos con animación */}
      <div className={`mt-10 mb-4 transform transition-all duration-500 delay-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        <h2 className="text-lg font-medium text-gray-900">Lista de Proyectos</h2>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {/* Vista de tarjetas */}
        <div className="p-4">
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, index) => (
                <div 
                  key={project.id} 
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-500 cursor-pointer transform ${
                    isVisible 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-4 scale-95'
                  }`}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                  onClick={() => navigate(`/admin/proyectos/${project.id}`)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {project.nombre}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/admin/proyectos/${project.id}`)}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-full"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(project)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Total: {formatCurrency(project.montoTotal)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>IVA: {formatCurrency(project.iva)}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Inicio: {formatDate(project.fechaInicio)}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Fin: {formatDate(project.fechaFinalizacion)}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 col-span-2">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Anticipo: {formatCurrency(project.anticipo)}</span>
                      </div>
                    </div>

                    {project.descripcion && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Descripción</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {project.descripcion}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">Equipo</h4>
                        <span className="text-xs text-gray-500">
                          {project.trabajadores?.length || 0} trabajadores
                        </span>
                      </div>
                      <div className="mt-2 flex -space-x-2">
                        {(project.trabajadores || []).slice(0, 3).map((trabajador, idx) => (
                          <div
                            key={trabajador.id || idx}
                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                            style={{
                              backgroundColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                          >
                            {(trabajador.nombre || '?').charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {(project.trabajadores || []).length > 3 && (
                          <div
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-2 ring-white"
                          >
                            <span className="text-xs font-medium text-gray-500">
                              +{project.trabajadores.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 transform transition-all duration-500 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}>
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proyectos</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza agregando un nuevo proyecto.</p>
              <div className="mt-6">
                <Link
                  to="/admin/proyectos/nuevo"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Nuevo Proyecto
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

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
                        ¿Estás seguro de eliminar el proyecto "{projectToDelete?.nombre}"? Esta acción no se puede deshacer y eliminará todos los datos asociados, incluyendo pagos y documentos.
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
  )
}

export default ProyectosPage 