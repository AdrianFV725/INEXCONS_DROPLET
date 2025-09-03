import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { projectService } from '../../services/projectService'
import { contractorService } from '../../services/contractorService'
import { conceptoService } from '../../services/conceptoService'
import { clientePagoService } from '../../services/clientePagoService'
import { workerService } from '../../services/workerService'
import { gastoGeneralService } from '../../services/gastoGeneralService'
import ConceptoItem from '../../components/ConceptoItem'
import ConceptoForm from '../../components/ConceptoForm'
import { PagoForm } from '../../components/PagoForm'
import ProyectoStatusPanel from '../../components/ProyectoStatusPanel'
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  UserPlusIcon,
  DocumentPlusIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

const ProyectoDetallePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showContractorModal, setShowContractorModal] = useState(false)
  const [showConceptoModal, setShowConceptoModal] = useState(false)
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [showClientePagoModal, setShowClientePagoModal] = useState(false)
  const [showGastoGeneralModal, setShowGastoGeneralModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [availableContractors, setAvailableContractors] = useState([])
  const [selectedContractors, setSelectedContractors] = useState([])
  const [contratistasWithConceptos, setContratistasWithConceptos] = useState([])
  const [selectedContratista, setSelectedContratista] = useState(null)
  const [selectedConcepto, setSelectedConcepto] = useState(null)
  const [conceptoToEdit, setConceptoToEdit] = useState(null)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [showDeleteProyectoModal, setShowDeleteProyectoModal] = useState(false)
  const [showDeleteGastoModal, setShowDeleteGastoModal] = useState(false)
  const [conceptoToDelete, setConceptoToDelete] = useState(null)
  const [gastosGenerales, setGastosGenerales] = useState([])
  const [gastoToDelete, setGastoToDelete] = useState(null)
  const [newGasto, setNewGasto] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    tipo: 'operativo'
  })
  const [newPayment, setNewPayment] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
  })
  const [pagoToDelete, setPagoToDelete] = useState(null)

  useEffect(() => {
    loadProject()
    loadContractors()
    loadContratistasWithConceptos()
    loadGastosGenerales()
  }, [id])

  const loadProject = async () => {
    try {
      console.log('Cargando proyecto con ID:', id)
      const data = await projectService.getById(id)
      console.log('Datos del proyecto recibidos:', data)
      if (!data) {
        console.error('No se recibieron datos del proyecto')
        setError('No se encontraron datos del proyecto')
        setProject(null)
      } else {
        // Intentar cargar los pagos del cliente
        try {
          const pagosCliente = await clientePagoService.getPagos(id);
          console.log('Pagos del cliente cargados:', pagosCliente);

          // Combinar los datos del proyecto con los pagos del cliente
          const projectWithClientePagos = {
            ...data,
            pagos: pagosCliente.data || []
          };

          setProject(projectWithClientePagos);
        } catch (pagoError) {
          console.error('Error al cargar pagos del cliente:', pagoError);
          // Si falla la carga de pagos, usar los datos del proyecto sin pagos
          setProject(data);
        }

        // Inicializar contratistas seleccionados
        if (data.contratistas) {
          setSelectedContractors(data.contratistas.map(c => c.id))
        }
        setError(null)
      }
    } catch (err) {
      console.error('Error al cargar el proyecto:', err)
      setError(err.response?.data?.error || 'Error al cargar el proyecto')
      setProject(null)
    } finally {
      setIsLoading(false)
    }
  }

  const loadContractors = async () => {
    try {
      const data = await contractorService.getAll()
      setAvailableContractors(data)
    } catch (err) {
      console.error('Error al cargar contratistas:', err)
    }
  }

  const loadContratistasWithConceptos = async () => {
    try {
      const data = await projectService.getContratistasWithConceptos(id)
      setContratistasWithConceptos(data)
    } catch (err) {
      console.error('Error al cargar contratistas con conceptos:', err)
    }
  }

  const loadGastosGenerales = async () => {
    try {
      const response = await gastoGeneralService.getGastos(id)
      if (response.success) {
        setGastosGenerales(response.data || [])
      } else {
        console.error('Error al cargar gastos generales:', response.message)
      }
    } catch (err) {
      console.error('Error al cargar gastos generales:', err)
    }
  }

  const handleOpenDeleteProyectoModal = () => {
    setShowDeleteProyectoModal(true)
  }

  const handleCloseDeleteProyectoModal = () => {
    setShowDeleteProyectoModal(false)
  }

  const confirmDeleteProyecto = async () => {
    try {
      await projectService.delete(id)
      navigate('/admin/proyectos')
    } catch (err) {
      setError('Error al eliminar el proyecto')
      console.error('Error:', err)
    } finally {
      handleCloseDeleteProyectoModal()
    }
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    try {
      await projectService.addPayment(id, newPayment)
      setShowPaymentModal(false)
      setNewPayment({
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
      })
      loadProject()
    } catch (err) {
      setError('Error al registrar el pago')
      console.error('Error:', err)
    }
  }

  const handleContractorSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!id) {
        throw new Error('ID del proyecto no encontrado')
      }

      await projectService.updateContractors(id, selectedContractors)
      setShowContractorModal(false)
      setSelectedContractors([])
      await loadProject()
      await loadContratistasWithConceptos()
      setSuccessMessage('Contratistas actualizados correctamente')
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (err) {
      console.error('Error al actualizar contratistas:', err)
      setError(err.response?.data?.message || 'Error al actualizar contratistas')
      setShowSuccessMessage(false)
    }
  }

  const handleContractorChange = (contractorId) => {
    setSelectedContractors(prev => {
      if (prev.includes(contractorId)) {
        return prev.filter(id => id !== contractorId)
      } else {
        return [...prev, contractorId]
      }
    })
  }

  const handleConceptoSubmit = async (conceptoData) => {
    try {
      if (conceptoToEdit) {
        // Actualizar concepto existente
        await conceptoService.update(conceptoData.id, conceptoData)
      } else {
        // Crear nuevo concepto
        await projectService.createConcepto(id, selectedContratista.id, conceptoData)
      }
      setShowConceptoModal(false)
      setConceptoToEdit(null)
      loadContratistasWithConceptos()
    } catch (err) {
      setError(conceptoToEdit ? 'Error al actualizar el concepto' : 'Error al crear el concepto')
      console.error('Error:', err)
    }
  }

  const handlePagoSubmit = async (pagoData) => {
    try {
      await conceptoService.addPayment(selectedConcepto, pagoData)
      setShowPagoModal(false)
      loadContratistasWithConceptos()
    } catch (err) {
      setError('Error al registrar el pago')
      console.error('Error:', err)
    }
  }

  const handleAddConcepto = (contratista) => {
    setSelectedContratista(contratista)
    setConceptoToEdit(null)
    setShowConceptoModal(true)
  }

  const handleEditConcepto = (concepto) => {
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
      loadContratistasWithConceptos()
    } catch (err) {
      setError('Error al eliminar el concepto')
      console.error('Error:', err)
    }
  }

  const handleAddPago = (conceptoId) => {
    setSelectedConcepto(conceptoId)
    setShowPagoModal(true)
  }

  const handleClientePagoSubmit = async (pagoData) => {
    try {
      console.log('Enviando datos de pago del cliente:', pagoData);

      // Convertir el monto a número
      const monto = parseFloat(pagoData.monto);

      // Formatear la fecha correctamente
      let fechaFormateada = pagoData.fecha;
      if (fechaFormateada && typeof fechaFormateada === 'string') {
        // Asegurarse de que la fecha esté en formato YYYY-MM-DD
        const partesFecha = fechaFormateada.split('-');
        if (partesFecha.length === 3) {
          fechaFormateada = `${partesFecha[0]}-${partesFecha[1].padStart(2, '0')}-${partesFecha[2].padStart(2, '0')}`;
        }
      }

      // Preparar los datos del pago
      const clientePagoData = {
        monto: monto,
        fecha: fechaFormateada,
        descripcion: pagoData.descripcion || '',
      };

      console.log('Datos formateados para enviar:', clientePagoData);

      // Usar el servicio específico para pagos del cliente
      const response = await clientePagoService.addPago(id, clientePagoData);
      console.log('Respuesta del servidor:', response);

      setShowClientePagoModal(false);
      setError(null); // Limpiar cualquier error previo

      // Recargar el proyecto para mostrar el nuevo pago
      await loadProject();

      // Mostrar mensaje de éxito
      setSuccessMessage(`Pago de ${formatCurrency(monto)} registrado correctamente`);
      setShowSuccessMessage(true);

      // Ocultar el mensaje después de 5 segundos
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    } catch (err) {
      console.error('Error detallado al registrar el pago del cliente:', err);

      // Mensaje de error más descriptivo
      if (err.response) {
        // El servidor respondió con un código de error
        const errorMessage = err.response.data?.error || err.response.data?.message || err.response.statusText;
        setError(`Error al registrar el pago: ${errorMessage}`);
        console.error('Respuesta de error del servidor:', err.response.data);
      } else if (err.request) {
        // La petición fue hecha pero no se recibió respuesta
        setError('No se recibió respuesta del servidor. Verifica tu conexión a internet.');
      } else {
        // Error al configurar la petición
        setError(`Error al registrar el pago: ${err.message}`);
      }
    }
  };

  const formatCurrency = (amount, decimals = 2) => {
    // Para dispositivos móviles, es mejor mostrar sin decimales para ahorrar espacio
    // y con una notación compacta para números grandes
    const isMobile = window.innerWidth < 640; // Corresponde al breakpoint 'sm' de Tailwind

    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: decimals,
      // Usar notación compacta para números grandes en móviles
      notation: isMobile && amount >= 10000 ? 'compact' : 'standard'
    }).format(amount)
  }

  const formatDate = (date) => {
    if (!date) return ''
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(date).toLocaleDateString('es-MX', options)
  }

  const calculateTotalPaid = () => {
    if (!project || !project.pagos) return 0;
    // Filtrar solo los pagos del cliente (tipo = 'cliente')
    const pagosDireclosCliente = project.pagos.filter(pago => pago.tipo === 'cliente');
    return pagosDireclosCliente.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);
  }

  const calculateBalance = () => {
    if (!project) return 0
    // Incluir el IVA en el cálculo del balance
    const totalConIVA = parseFloat(project.montoTotal) + parseFloat(project.iva || 0);
    return totalConIVA - calculateTotalPaid()
  }

  const handleDeletePago = async (pago) => {
    setPagoToDelete(pago);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeletePago = async () => {
    try {
      await clientePagoService.deletePago(id, pagoToDelete.id);
      setShowDeleteConfirmModal(false);
      setPagoToDelete(null);
      await loadProject();
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

  const handleDeleteConceptoPago = async (conceptoId, pagoId) => {
    try {
      await conceptoService.deletePayment(conceptoId, pagoId);
      loadContratistasWithConceptos();
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

  const handleGastoGeneralSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await gastoGeneralService.addGasto(id, newGasto)
      if (response.success) {
        setShowGastoGeneralModal(false)
        setNewGasto({
          monto: '',
          fecha: new Date().toISOString().split('T')[0],
          descripcion: '',
          tipo: 'operativo'
        })
        await loadGastosGenerales()

        // Mostrar mensaje de éxito
        setSuccessMessage('Gasto general registrado correctamente')
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      } else {
        setError(response.message || 'Error al registrar el gasto general')
      }
    } catch (err) {
      setError('Error al registrar el gasto general')
      console.error('Error:', err)
    }
  }

  const handleDeleteGasto = (gastoId) => {
    setGastoToDelete(gastoId)
    setShowDeleteGastoModal(true)
  }

  const confirmDeleteGasto = async () => {
    try {
      const response = await gastoGeneralService.deleteGasto(id, gastoToDelete)
      if (response.success) {
        setShowDeleteGastoModal(false)
        setGastoToDelete(null)
        await loadGastosGenerales()
        setSuccessMessage('Gasto general eliminado correctamente')
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      } else {
        setError(response.message || 'Error al eliminar el gasto general')
      }
    } catch (err) {
      setError('Error al eliminar el gasto general')
      console.error('Error:', err)
    }
  }

  const handleGastoChange = (e) => {
    const { name, value } = e.target
    setNewGasto(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const renderContractorsSection = () => {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Contratistas
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Contratistas asignados a este proyecto
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowContractorModal(true);
              // Inicializar los contratistas seleccionados con los actuales
              if (project?.contratistas) {
                setSelectedContractors(project.contratistas.map(c => c.id));
              }
            }}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UserPlusIcon className="h-4 w-4 mr-1" />
            Asignar
          </button>
        </div>
        <div className="border-t border-gray-200">
          {project?.contratistas && project.contratistas.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {project.contratistas.map((contractor) => (
                <li key={contractor.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {contractor.nombre}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        RFC: <span className="uppercase">{contractor.rfc}</span>
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Teléfono: {contractor.telefono}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => handleAddConcepto(contractor)}
                        className="px-2 py-1 inline-flex items-center justify-center text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 whitespace-nowrap"
                      >
                        <DocumentPlusIcon className="h-3 w-3 mr-1" />
                        Agregar concepto
                      </button>
                      <Link
                        to={`/admin/contratistas/${contractor.id}`}
                        className="px-2 py-1 inline-flex items-center justify-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 whitespace-nowrap"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
              No hay contratistas asignados a este proyecto
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderGastosGeneralesSection = () => {
    // Calcular el total de gastos generales
    const totalGastos = gastosGenerales.reduce((sum, gasto) => sum + parseFloat(gasto.monto || 0), 0);

    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Gastos Generales
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Gastos adicionales del proyecto
            </p>
          </div>
          <button
            onClick={() => setShowGastoGeneralModal(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <BanknotesIcon className="h-4 w-4 mr-1" />
            Registrar Gasto
          </button>
        </div>

        {/* Resumen de gastos totales */}
        <div className="px-4 py-4 bg-gray-50 border-t border-b border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Gastos Generales:</span>
            <span className="text-lg font-semibold text-gray-900">{formatCurrency(totalGastos)}</span>
          </div>
        </div>

        <div className="border-t border-gray-200">
          {gastosGenerales.length > 0 ? (
            <div>
              {/* Vista de tabla para pantallas grandes */}
              <div className="hidden sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {gastosGenerales.map((gasto) => (
                      <tr key={gasto.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {gasto.descripcion}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(gasto.fecha)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatCurrency(gasto.monto)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteGasto(gasto.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista de tarjetas para móviles */}
              <div className="sm:hidden divide-y divide-gray-200">
                {gastosGenerales.map((gasto) => (
                  <div key={gasto.id} className="p-4 bg-white hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 break-words pr-4">
                          {gasto.descripcion}
                        </p>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            gasto.tipo === 'operativo' ? 'bg-blue-100 text-blue-800' :
                            gasto.tipo === 'administrativo' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {gasto.tipo.charAt(0).toUpperCase() + gasto.tipo.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">{formatDate(gasto.fecha)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteGasto(gasto.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-2 bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500 uppercase mb-1">Monto</p>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(gasto.monto)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 px-4">
              <div className="bg-gray-50 rounded-lg p-6">
                <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  No hay gastos generales registrados
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContratistasWithConceptos = () => {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-4">
        <div className="px-3 py-3 sm:px-4">
          <h3 className="text-base leading-6 font-medium text-gray-900">
            Conceptos por Contratista
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-gray-500">
            Trabajos y pagos por contratista en este proyecto
          </p>
        </div>
        <div className="border-t border-gray-200">
          {contratistasWithConceptos && contratistasWithConceptos.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {contratistasWithConceptos.map((item) => {
                // Calcular totales para este contratista
                let totalContratista = 0;
                let totalPagadoContratista = 0;

                if (item.conceptos && item.conceptos.length > 0) {
                  item.conceptos.forEach(concepto => {
                    totalContratista += parseFloat(concepto.monto_total || 0);
                    const pagado = concepto.pagos.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);
                    totalPagadoContratista += pagado;
                  });
                }

                const totalPendienteContratista = totalContratista - totalPagadoContratista;
                const porcentajePagado = totalContratista > 0 ? (totalPagadoContratista / totalContratista) * 100 : 0;

                return (
                  <div key={item.contratista.id} className="p-3">
                    <div 
                      className="flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                      onClick={(e) => {
                        if (!e.target.closest('button')) {
                          const element = document.getElementById(`conceptos-${item.contratista.id}`);
                          if (element) {
                            element.classList.toggle('hidden');
                          }
                        }
                      }}
                    >
                      {/* Información del contratista */}
                      <div className="flex-1 mb-3 sm:mb-0 sm:mr-6">
                        <div className="flex items-center justify-between sm:justify-start sm:space-x-3 mb-2">
                          <h4 className="text-sm font-medium text-indigo-600">
                            {item.contratista.nombre}
                          </h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {item.conceptos?.length || 0} conceptos
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
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(totalContratista)}
                            </p>
                          </div>
                          <div className="bg-green-50 p-2 rounded-lg">
                            <p className="text-[10px] text-gray-500 uppercase mb-0.5">Pagado</p>
                            <p className="text-sm font-medium text-green-600">
                              {formatCurrency(totalPagadoContratista)}
                            </p>
                          </div>
                          <div className="bg-red-50 p-2 rounded-lg">
                            <p className="text-[10px] text-gray-500 uppercase mb-0.5">Pendiente</p>
                            <p className="text-sm font-medium text-red-600">
                              {formatCurrency(totalPendienteContratista)}
                            </p>
                          </div>
                        </div>

                        {/* Montos para escritorio */}
                        <div className="hidden sm:flex items-center space-x-8 mt-3">
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Total</p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(totalContratista)}</p>
                          </div>
                          <div className="h-8 w-px bg-gray-200"></div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Pagado</p>
                            <p className="text-sm font-medium text-green-600">{formatCurrency(totalPagadoContratista)}</p>
                          </div>
                          <div className="h-8 w-px bg-gray-200"></div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Pendiente</p>
                            <p className="text-sm font-medium text-red-600">{formatCurrency(totalPendienteContratista)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddConcepto(item.contratista);
                          }}
                          className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Agregar concepto
                        </button>
                        <Link
                          to={`/admin/contratistas/${item.contratista.id}`}
                          className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver detalle
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const element = document.getElementById(`conceptos-${item.contratista.id}`);
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
                    <div id={`conceptos-${item.contratista.id}`} className="hidden mt-3 pl-2 border-t border-gray-100 pt-3">
                      {item.conceptos && item.conceptos.length > 0 ? (
                        <div className="space-y-3">
                          {item.conceptos.map((concepto) => (
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
                          No hay conceptos registrados para este contratista
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
              No hay contratistas con conceptos en este proyecto
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWorkersSection = () => {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Trabajadores
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Trabajadores asignados a este proyecto
            </p>
          </div>
          <Link
            to={`/admin/trabajadores`}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UserPlusIcon className="h-4 w-4 mr-1" />
            Gestionar
          </Link>
        </div>
        <div className="border-t border-gray-200">
          {project?.trabajadores && project.trabajadores.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {project.trabajadores.map((worker) => (
                <li key={worker.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {worker.nombre} {worker.apellidos}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        RFC: <span className="uppercase">{worker.rfc || 'No disponible'}</span>
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Teléfono: {worker.telefono || 'No disponible'}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Sueldo base: ${parseFloat(worker.sueldo_base).toFixed(2)}
                      </p>
                      {worker.pivot && (
                        <div className="mt-2 text-xs text-gray-500">
                          <p>
                            <span className="font-medium">Asignado:</span> {formatDate(worker.pivot.fecha_asignacion || worker.pivot.created_at)}
                          </p>
                          {worker.pivot.fecha_finalizacion && (
                            <p>
                              <span className="font-medium">Finalizado:</span> {formatDate(worker.pivot.fecha_finalizacion)}
                            </p>
                          )}
                          {worker.pivot.observaciones && (
                            <p>
                              <span className="font-medium">Observaciones:</span> {worker.pivot.observaciones}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="ml-2 flex-shrink-0 flex space-x-2">
                      <Link
                        to={`/admin/trabajadores/${worker.id}`}
                        className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
              No hay trabajadores asignados a este proyecto
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderPagosClienteSection = () => {
    if (!project || !project.pagos) return null;

    // Filtrar solo los pagos directos del cliente (tipo = 'cliente')
    const pagosDireclosCliente = project.pagos.filter(pago => pago.tipo === 'cliente');

    // Calcular totales solo con los pagos directos del cliente
    const totalPagado = calculateTotalPaid();
    const totalPendiente = calculateBalance();
    // Incluir el IVA en el total del proyecto
    const totalProyecto = parseFloat(project.montoTotal) + parseFloat(project.iva || 0);

    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Pagos del Cliente al Proyecto
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Control de pagos realizados por el cliente al arquitecto
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowClientePagoModal(true)}
            className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
            Registrar Pago
          </button>
        </div>

        {/* Tarjeta de resumen financiero - Visible en todos los tamaños de pantalla */}
        <div className="px-4 py-4 bg-gray-50 border-t border-b border-gray-200">
          <div className="max-w-3xl mx-auto">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Resumen Financiero</h4>

            {/* Barra de progreso */}
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-600">Progreso de pagos</span>
                <span className="text-xs font-medium text-gray-700">
                  {totalProyecto > 0 ? ((totalPagado / totalProyecto) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${totalProyecto > 0 ? (totalPagado / totalProyecto) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1 text-center">Total Proyecto</p>
                <p className="text-lg font-semibold text-gray-800 text-center">{formatCurrency(totalProyecto)}</p>
              </div>

              <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100 bg-green-50">
                <p className="text-xs text-green-700 mb-1 text-center">Pagado</p>
                <p className="text-lg font-semibold text-green-600 text-center">{formatCurrency(totalPagado)}</p>
              </div>

              <div className="bg-white p-3 rounded-lg shadow-sm border border-red-100 bg-red-50">
                <p className="text-xs text-red-700 mb-1 text-center">Pendiente</p>
                <p className="text-lg font-semibold text-red-600 text-center">{formatCurrency(totalPendiente)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200">
          {pagosDireclosCliente && pagosDireclosCliente.length > 0 ? (
            <div className="overflow-x-auto">
              {/* Tabla para pantallas medianas y grandes */}
              <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagosDireclosCliente.map((pago) => (
                    <tr key={pago.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(pago.fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(pago.monto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pago.descripcion || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${pago.es_anticipo ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {pago.es_anticipo ? 'Anticipo' : 'Pago'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleDeletePago(pago)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Vista de tarjetas para móviles */}
              <div className="sm:hidden divide-y divide-gray-200">
                {pagosDireclosCliente.map((pago) => (
                  <div key={pago.id} className="p-4 bg-white">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Fecha</p>
                        <p className="text-sm text-gray-900">{formatDate(pago.fecha)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Monto</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{formatCurrency(pago.monto)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Descripción</p>
                        <p className="text-sm text-gray-900">{pago.descripcion || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Tipo</p>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${pago.es_anticipo ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {pago.es_anticipo ? 'Anticipo' : 'Pago'}
                        </span>
                      </div>
                      <div className="col-span-2 mt-2">
                        <button
                          onClick={() => handleDeletePago(pago)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
              No hay pagos registrados del cliente
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderContractorModal = () => {
    if (!showContractorModal) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Asignar Contratistas
              </h3>
              <button
                onClick={() => {
                  setShowContractorModal(false)
                  setSelectedContractors([])
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 max-h-96 overflow-y-auto">
              {availableContractors && availableContractors.length > 0 ? (
                availableContractors.map((contractor) => (
                  <div key={contractor.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`contractor-${contractor.id}`}
                      checked={selectedContractors.includes(contractor.id)}
                      onChange={() => handleContractorChange(contractor.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`contractor-${contractor.id}`}
                      className="ml-2 block text-sm text-gray-900"
                    >
                      {contractor.nombre}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  No hay contratistas disponibles
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowContractorModal(false)
                  setSelectedContractors([])
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleContractorSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
                    {conceptoToEdit ? 'Editar' : 'Agregar'} Concepto para {selectedContratista?.nombre}
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
    )
  }

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
    )
  }

  const renderGastoGeneralModal = () => {
    return (
      <div
        className={`fixed z-10 inset-0 overflow-y-auto ${
          showGastoGeneralModal ? 'block' : 'hidden'
        }`}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            onClick={() => setShowGastoGeneralModal(false)}
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
                    Registrar Gasto General
                  </h3>
                  <div className="mt-4">
                    <form onSubmit={handleGastoGeneralSubmit}>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                            Descripción
                          </label>
                          <input
                            type="text"
                            name="descripcion"
                            id="descripcion"
                            value={newGasto.descripcion}
                            onChange={handleGastoChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="monto" className="block text-sm font-medium text-gray-700">
                            Monto
                          </label>
                          <input
                            type="number"
                            name="monto"
                            id="monto"
                            value={newGasto.monto}
                            onChange={handleGastoChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            step="0.01"
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">
                            Fecha
                          </label>
                          <input
                            type="date"
                            name="fecha"
                            id="fecha"
                            value={newGasto.fecha}
                            onChange={handleGastoChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
                            Tipo
                          </label>
                          <select
                            name="tipo"
                            id="tipo"
                            value={newGasto.tipo}
                            onChange={handleGastoChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                          >
                            <option value="operativo">Operativo</option>
                            <option value="administrativo">Administrativo</option>
                            <option value="otros">Otros</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                          Registrar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowGastoGeneralModal(false)}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
        </div>
      </div>
    );
  };

  const renderClientePagoModal = () => {
    return (
      <div
        className={`fixed z-10 inset-0 overflow-y-auto ${
          showClientePagoModal ? 'block' : 'hidden'
        }`}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            onClick={() => setShowClientePagoModal(false)}
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
                    Registrar Pago del Cliente
                  </h3>
                  <div className="mt-4">
                    <PagoForm
                      onSubmit={handleClientePagoSubmit}
                      onCancel={() => setShowClientePagoModal(false)}
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : project ? (
        <>
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

          {/* Encabezado del proyecto */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <Link
                  to="/admin/proyectos"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Regresar
                </Link>
                <div>
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    {project.nombre}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Detalles y gestión del proyecto
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link
                  to={`/admin/proyectos/editar/${id}`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Editar
                </Link>
                <button
                  onClick={handleOpenDeleteProyectoModal}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>

          {/* Panel de estado del proyecto */}
          <ProyectoStatusPanel 
            project={project} 
            contratistasWithConceptos={contratistasWithConceptos}
            gastosGenerales={gastosGenerales}
            formatCurrency={formatCurrency}
          />

          {/* Sección de resumen financiero */}
          {renderPagosClienteSection()}

          {/* Sección de gastos generales */}
          {renderGastosGeneralesSection()}

          {/* Sección de conceptos por contratista */}
          {renderContratistasWithConceptos()}

          {/* Sección de trabajadores */}
          {renderWorkersSection()}

          {/* Sección de contratistas */}
          {renderContractorsSection()}

          {/* Modales */}
          {renderContractorModal()}
          {renderConceptoModal()}
          {renderPagoModal()}
          {renderGastoGeneralModal()}
          {renderClientePagoModal()}

          {/* Modal de confirmación de eliminación */}
          {showDeleteConfirmModal && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Confirmar eliminación
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            ¿Estás seguro que deseas eliminar este elemento? Esta acción no se puede deshacer.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={conceptoToDelete ? confirmDeleteConcepto : confirmDeletePago}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirmModal(false)
                        setConceptoToDelete(null)
                        setPagoToDelete(null)
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

          {/* Modal de confirmación de eliminación del proyecto */}
          {showDeleteProyectoModal && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Eliminar proyecto
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            ¿Estás seguro que deseas eliminar este proyecto? Esta acción no se puede deshacer y eliminará todos los datos asociados.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={confirmDeleteProyecto}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Eliminar
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseDeleteProyectoModal}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de confirmación de eliminación de gasto general */}
          {showDeleteGastoModal && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Confirmar eliminación
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            ¿Estás seguro que deseas eliminar este gasto general? Esta acción no se puede deshacer.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={confirmDeleteGasto}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteGastoModal(false)
                        setGastoToDelete(null)
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
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontró el proyecto</p>
        </div>
      )}
    </div>
  );
}

export default ProyectoDetallePage;
