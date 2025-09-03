import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { contractorService } from '../../services/contractorService'
import { projectService } from '../../services/projectService'
import { conceptoService } from '../../services/conceptoService'
import ConceptoItem from '../../components/ConceptoItem'
import ConceptoForm from '../../components/ConceptoForm'
import PagoForm from '../../components/PagoForm'
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  DocumentPlusIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

const ContratistaDetallePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [contractor, setContractor] = useState(null)
  const [projects, setProjects] = useState([])
  const [availableProjects, setAvailableProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showConceptoModal, setShowConceptoModal] = useState(false)
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedProyecto, setSelectedProyecto] = useState(null)
  const [selectedConcepto, setSelectedConcepto] = useState(null)
  const [conceptosPorProyecto, setConceptosPorProyecto] = useState({})
  const [conceptoToEdit, setConceptoToEdit] = useState(null)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [conceptoToDelete, setConceptoToDelete] = useState(null)
  const [showDeleteContratistaModal, setShowDeleteContratistaModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showRemoveProjectModal, setShowRemoveProjectModal] = useState(false)
  const [projectToRemove, setProjectToRemove] = useState(null)

  useEffect(() => {
    loadContractor()
    loadProjects()
  }, [id])

  useEffect(() => {
    if (contractor && contractor.proyectos) {
      loadConceptosPorProyecto();
    }
  }, [contractor]);

  const loadContractor = async () => {
    try {
      const data = await contractorService.getById(id)
      setContractor(data)
      setError(null)
    } catch (err) {
      setError('Error al cargar el contratista')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const data = await projectService.getAll()
      setProjects(data)
      updateAvailableProjects(data, contractor?.proyectos || [])
    } catch (err) {
      console.error('Error al cargar proyectos:', err)
    }
  }

  const loadConceptosPorProyecto = async () => {
    try {
      const conceptos = {};
      for (const proyecto of contractor.proyectos) {
        const data = await contractorService.getConceptosByProyecto(id, proyecto.id);
        conceptos[proyecto.id] = data;
      }
      setConceptosPorProyecto(conceptos);
    } catch (err) {
      console.error('Error al cargar conceptos por proyecto:', err);
    }
  };

  const updateAvailableProjects = (allProjects, assignedProjects) => {
    const assignedIds = assignedProjects.map((p) => p.id)
    setAvailableProjects(allProjects.filter((p) => !assignedIds.includes(p.id)))
  }

  const handleDelete = () => {
    setShowDeleteContratistaModal(true)
  }

  const confirmDeleteContratista = async () => {
    try {
      await contractorService.delete(id)
      setShowDeleteContratistaModal(false)
      navigate('/admin/contratistas')
    } catch (err) {
      setError('Error al eliminar el contratista')
      console.error('Error:', err)
    }
  }

  const handleAssignProject = async (e) => {
    e.preventDefault()
    if (!selectedProject) return

    try {
      await contractorService.assignToProject(id, selectedProject)
      setShowAssignModal(false)
      setSelectedProject('')
      loadContractor()
    } catch (err) {
      setError('Error al asignar el proyecto')
      console.error('Error:', err)
    }
  }

  const handleRemoveProject = async (projectId) => {
    const project = contractor.proyectos.find(p => p.id === projectId)
    setProjectToRemove(project)
    setShowRemoveProjectModal(true)
  }

  const confirmRemoveProject = async () => {
    try {
      await contractorService.removeFromProject(id, projectToRemove.id)
      setShowRemoveProjectModal(false)
      setProjectToRemove(null)
      loadContractor()
      setSuccessMessage('Contratista removido del proyecto correctamente')
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (err) {
      setError('Error al remover el proyecto')
      console.error('Error:', err)
    }
  }

  const handleAddConcepto = (proyecto) => {
    setSelectedProyecto(proyecto)
    setConceptoToEdit(null)
    setShowConceptoModal(true)
  }

  const handleEditConcepto = (concepto) => {
    // Buscar el proyecto al que pertenece este concepto
    for (const proyectoId in conceptosPorProyecto) {
      const found = conceptosPorProyecto[proyectoId].find(c => c.id === concepto.id);
      if (found) {
        // Encontramos el proyecto
        const proyecto = contractor.proyectos.find(p => p.id.toString() === proyectoId);
        if (proyecto) {
          setSelectedProyecto(proyecto);
          break;
        }
      }
    }
    setConceptoToEdit(concepto)
    setShowConceptoModal(true)
  }

  const handleDeleteConcepto = (conceptoId) => {
    setConceptoToDelete(conceptoId)
    setShowDeleteConfirmModal(true)
  }

  const confirmDeleteConcepto = async () => {
    try {
      await conceptoService.delete(conceptoToDelete)
      setShowDeleteConfirmModal(false)
      setConceptoToDelete(null)
      loadConceptosPorProyecto()
    } catch (err) {
      setError('Error al eliminar el concepto')
      console.error('Error:', err)
    }
  }

  const handleAddPago = (conceptoId) => {
    setSelectedConcepto(conceptoId)
    setShowPagoModal(true)
  }

  const handleDeleteConceptoPago = async (conceptoId, pagoId) => {
    try {
      await conceptoService.deletePayment(conceptoId, pagoId);
      loadConceptosPorProyecto();
      setSuccessMessage('Pago eliminado correctamente');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    } catch (err) {
      console.error('Error al eliminar el pago:', err);
      setError('Error al eliminar el pago');
    }
  };

  const handleConceptoSubmit = async (conceptoData) => {
    try {
      if (conceptoToEdit) {
        // Actualizar concepto existente
        await conceptoService.update(conceptoData.id, conceptoData)
      } else {
        // Crear nuevo concepto
        const data = {
          ...conceptoData,
          proyecto_id: selectedProyecto.id,
          contratista_id: id
        }
        await conceptoService.create(data)
      }
      setShowConceptoModal(false)
      setConceptoToEdit(null)
      loadConceptosPorProyecto()
    } catch (err) {
      setError(conceptoToEdit ? 'Error al actualizar el concepto' : 'Error al crear el concepto')
      console.error('Error:', err)
    }
  }

  const handlePagoSubmit = async (pagoData) => {
    try {
      await conceptoService.addPayment(selectedConcepto, pagoData);
      setShowPagoModal(false);
      loadConceptosPorProyecto();
    } catch (err) {
      setError('Error al registrar el pago');
      console.error('Error:', err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!contractor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se encontró el contratista</p>
        <Link
          to="/admin/contratistas"
          className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-900"
        >
          ← Volver a Contratistas
        </Link>
      </div>
    )
  }

  const renderProyectosConConceptos = () => {
    if (!contractor || !contractor.proyectos || contractor.proyectos.length === 0) {
      return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Proyectos y Conceptos
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Este contratista no tiene proyectos asignados
            </p>
          </div>
        </div>
      );
    }

    // Función para formatear moneda
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(amount);
    };

    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-4">
        <div className="px-3 py-3 sm:px-4">
          <h3 className="text-base leading-6 font-medium text-gray-900">
            Conceptos por Proyecto
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-gray-500">
            Trabajos y pagos por proyecto
          </p>
        </div>
        <div className="border-t border-gray-200">
          {contractor.proyectos && contractor.proyectos.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {contractor.proyectos.map((proyecto) => {
                // Calcular totales para este proyecto
                let totalProyecto = 0;
                let totalPagadoProyecto = 0;

                if (conceptosPorProyecto[proyecto.id]) {
                  conceptosPorProyecto[proyecto.id].forEach(concepto => {
                    totalProyecto += parseFloat(concepto.monto_total || 0);
                    const pagado = concepto.pagos.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);
                    totalPagadoProyecto += pagado;
                  });
                }

                const totalPendienteProyecto = totalProyecto - totalPagadoProyecto;
                const porcentajePagado = totalProyecto > 0 ? (totalPagadoProyecto / totalProyecto) * 100 : 0;

                return (
                  <div key={proyecto.id} className="p-3">
                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                      onClick={(e) => {
                        if (!e.target.closest('button') && !e.target.closest('a')) {
                          const element = document.getElementById(`conceptos-${proyecto.id}`);
                          if (element) {
                            element.classList.toggle('hidden');
                          }
                        }
                      }}
                    >
                      {/* Información principal del proyecto */}
                      <div className="flex-1 mb-3 sm:mb-0 sm:mr-6">
                        <div className="flex items-center justify-between sm:justify-start sm:space-x-3 mb-2">
                          <h4 className="text-sm font-medium text-indigo-600">
                            {proyecto.nombre}
                          </h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {conceptosPorProyecto[proyecto.id]?.length || 0} conceptos
                          </span>
                        </div>

                        {/* Barra de progreso y porcentaje */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${porcentajePagado}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-600 min-w-[4rem] text-right">
                            {Math.round(porcentajePagado)}%
                          </span>
                        </div>

                        {/* Grid de montos para móvil */}
                        <div className="grid grid-cols-3 gap-2 sm:hidden">
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-[10px] text-gray-500 uppercase mb-0.5">Total</p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(totalProyecto)}</p>
                          </div>
                          <div className="bg-green-50 p-2 rounded-lg">
                            <p className="text-[10px] text-gray-500 uppercase mb-0.5">Pagado</p>
                            <p className="text-sm font-medium text-green-600">{formatCurrency(totalPagadoProyecto)}</p>
                          </div>
                          <div className="bg-red-50 p-2 rounded-lg">
                            <p className="text-[10px] text-gray-500 uppercase mb-0.5">Pendiente</p>
                            <p className="text-sm font-medium text-red-600">{formatCurrency(totalPendienteProyecto)}</p>
                          </div>
                        </div>

                        {/* Montos para escritorio */}
                        <div className="hidden sm:flex items-center space-x-8 mt-3">
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Total</p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(totalProyecto)}</p>
                          </div>
                          <div className="h-8 w-px bg-gray-200"></div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Pagado</p>
                            <p className="text-sm font-medium text-green-600">{formatCurrency(totalPagadoProyecto)}</p>
                          </div>
                          <div className="h-8 w-px bg-gray-200"></div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Pendiente</p>
                            <p className="text-sm font-medium text-red-600">{formatCurrency(totalPendienteProyecto)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddConcepto(proyecto);
                          }}
                          className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Agregar concepto
                        </button>
                        <Link
                          to={`/admin/proyectos/${proyecto.id}`}
                          className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver proyecto
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const element = document.getElementById(`conceptos-${proyecto.id}`);
                            if (element) {
                              element.classList.toggle('hidden');
                            }
                          }}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none sm:hidden"
                        >
                          <ChevronDownIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Lista de conceptos */}
                    <div id={`conceptos-${proyecto.id}`} className="hidden mt-3 pl-2 border-t border-gray-100 pt-3">
                      {conceptosPorProyecto[proyecto.id] && conceptosPorProyecto[proyecto.id].length > 0 ? (
                        <div className="space-y-3">
                          {conceptosPorProyecto[proyecto.id].map((concepto) => (
                            <ConceptoItem
                              key={concepto.id}
                              concepto={concepto}
                              onAddPayment={handleAddPago}
                              onEdit={handleEditConcepto}
                              onDelete={handleDeleteConcepto}
                              onDeletePayment={handleDeleteConceptoPago}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                          No hay conceptos registrados para este proyecto
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
              No hay proyectos asignados a este contratista
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConceptoModal = () => {
    return (
      <div
        className={`fixed z-10 inset-0 overflow-y-auto ${showConceptoModal ? 'block' : 'hidden'
          }`}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            onClick={() => setShowConceptoModal(false)}
          ></div>

          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900"
                    id="modal-title"
                  >
                    {conceptoToEdit ? 'Editar' : 'Agregar'} Concepto para {selectedProyecto?.nombre}
                  </h3>
                  <div className="mt-4">
                    <ConceptoForm
                      onSubmit={handleConceptoSubmit}
                      onCancel={() => {
                        setShowConceptoModal(false)
                        setConceptoToEdit(null)
                      }}
                      initialData={conceptoToEdit}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPagoModal = () => {
    return (
      <div
        className={`fixed z-10 inset-0 overflow-y-auto ${showPagoModal ? 'block' : 'hidden'
          }`}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            onClick={() => setShowPagoModal(false)}
          ></div>

          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900"
                    id="modal-title"
                  >
                    Agregar Pago
                  </h3>
                  <div className="mt-4">
                    <PagoForm
                      onSubmit={handlePagoSubmit}
                      onCancel={() => setShowPagoModal(false)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteConfirmModal = () => {
    return (
      <div
        className={`fixed z-10 inset-0 overflow-y-auto ${showDeleteConfirmModal ? 'block' : 'hidden'
          }`}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            onClick={() => setShowDeleteConfirmModal(false)}
          ></div>

          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Eliminar concepto
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      ¿Estás seguro de que deseas eliminar este concepto? Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={confirmDeleteConcepto}
              >
                Eliminar
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteContratistaModal = () => {
    return (
      <div
        className={`fixed z-10 inset-0 overflow-y-auto ${showDeleteContratistaModal ? 'block' : 'hidden'
          }`}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            onClick={() => setShowDeleteContratistaModal(false)}
          ></div>

          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Eliminar contratista
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      ¿Estás seguro de que deseas eliminar este contratista? Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={confirmDeleteContratista}
              >
                Eliminar
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setShowDeleteContratistaModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRemoveProjectModal = () => {
    return (
      <div
        className={`fixed z-10 inset-0 overflow-y-auto ${showRemoveProjectModal ? 'block' : 'hidden'
          }`}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            onClick={() => setShowRemoveProjectModal(false)}
          ></div>

          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <XMarkIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Remover del proyecto
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      ¿Estás seguro de que deseas remover al contratista del proyecto "{projectToRemove?.nombre}"? Esta acción no afectará los conceptos y pagos ya registrados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={confirmRemoveProject}
              >
                Remover
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setShowRemoveProjectModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderConceptosSection = () => {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Conceptos
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Trabajos y pagos realizados
            </p>
          </div>
          <button
            onClick={() => setShowConceptoModal(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Agregar Concepto
          </button>
        </div>

        {/* Resumen de totales */}
        <div className="px-4 py-4 bg-gray-50 border-t border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalConceptos)}</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100 bg-green-50">
              <p className="text-xs text-green-700 mb-1">Pagado</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPagado)}</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border border-red-100 bg-red-50">
              <p className="text-xs text-red-700 mb-1">Pendiente</p>
              <p className="text-lg font-semibold text-red-600">{formatCurrency(totalPendiente)}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200">
          {conceptos && conceptos.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {conceptos.map((concepto) => (
                <div key={concepto.id} className="p-4">
                  {/* Información principal del concepto */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                    <div className="flex-1 mb-3 sm:mb-0">
                      <div className="flex items-center justify-between sm:justify-start sm:space-x-3 mb-2">
                        <h4 className="text-sm font-medium text-indigo-600">
                          {concepto.descripcion}
                        </h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {concepto.pagos?.length || 0} pagos
                        </span>
                      </div>

                      {/* Barra de progreso */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${(concepto.pagos?.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0) / parseFloat(concepto.monto_total || 1)) * 100}%` }}
                        ></div>
                      </div>

                      {/* Grid de montos para móvil */}
                      <div className="grid grid-cols-3 gap-2 sm:hidden">
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-[10px] text-gray-500 uppercase mb-0.5">Total</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(concepto.monto_total)}
                          </p>
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg">
                          <p className="text-[10px] text-gray-500 uppercase mb-0.5">Pagado</p>
                          <p className="text-sm font-medium text-green-600">
                            {formatCurrency(concepto.pagos?.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0) || 0)}
                          </p>
                        </div>
                        <div className="bg-red-50 p-2 rounded-lg">
                          <p className="text-[10px] text-gray-500 uppercase mb-0.5">Pendiente</p>
                          <p className="text-sm font-medium text-red-600">
                            {formatCurrency(parseFloat(concepto.monto_total || 0) - (concepto.pagos?.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0) || 0))}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => handleAddPago(concepto.id)}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Agregar pago
                      </button>
                      <button
                        onClick={() => handleEditConcepto(concepto)}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteConcepto(concepto.id)}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Lista de pagos */}
                  {concepto.pagos && concepto.pagos.length > 0 && (
                    <div className="mt-4 pl-2 border-t border-gray-100 pt-3">
                      <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">Pagos realizados</h5>
                      <div className="space-y-2">
                        {concepto.pagos.map((pago) => (
                          <div key={pago.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{formatCurrency(pago.monto)}</p>
                              <p className="text-xs text-gray-500">{formatDate(pago.fecha)}</p>
                            </div>
                            <button
                              onClick={() => handleDeletePago(concepto.id, pago.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4">
              <div className="bg-gray-50 rounded-lg p-6">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  No hay conceptos registrados
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Mensaje de éxito */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-50 border-l-4 border-green-400 p-4 mb-4 rounded shadow-lg z-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : contractor ? (
        <>
          {/* Botón de volver */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/admin/contratistas')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Volver a Contratistas
            </button>
          </div>

          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {contractor.nombre}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{contractor.rfc}</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <button
                onClick={() => navigate(`/admin/contratistas/${id}/dashboard`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ChartBarIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                Dashboard
              </button>
              <button
                onClick={() => navigate(`/admin/contratistas/editar/${id}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="-ml-1 mr-2 h-5 w-5" />
                Eliminar
              </button>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Información del Contratista
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contractor.telefono}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">RFC</dt>
                  <dd className="mt-1 text-sm text-gray-900 uppercase">{contractor.rfc}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Documentos
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {contractor.documentos?.map((doc) => (
                  <li key={doc.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {doc.nombre}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(doc.fechaSubida)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Ver
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white shadow sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Proyectos Asignados
              </h3>
              <button
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Asignar Proyecto
              </button>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {contractor.proyectos?.map((proyecto) => (
                  <li key={proyecto.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <Link
                          to={`/admin/proyectos/${proyecto.id}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                        >
                          {proyecto.nombre}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {formatDate(proyecto.fechaInicio)} -{' '}
                          {formatDate(proyecto.fechaFinalizacion)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveProject(proyecto.id)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10">
            {renderProyectosConConceptos()}
          </div>
          {renderConceptoModal()}
          {renderPagoModal()}
          {renderDeleteConfirmModal()}
          {renderDeleteContratistaModal()}
          {renderRemoveProjectModal()}

          {showAssignModal && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  onClick={() => setShowAssignModal(false)}
                ></div>

                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Asignar Proyecto
                      </h3>
                      <form onSubmit={handleAssignProject} className="mt-4">
                        <div>
                          <label
                            htmlFor="proyecto"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Proyecto
                          </label>
                          <select
                            id="proyecto"
                            name="proyecto"
                            required
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          >
                            <option value="">Selecciona un proyecto</option>
                            {availableProjects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            Asignar
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAssignModal(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontró el contratista</p>
          <Link
            to="/admin/contratistas"
            className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-900"
          >
            ← Volver a Contratistas
          </Link>
        </div>
      )}
    </div>
  )
}

export default ContratistaDetallePage 