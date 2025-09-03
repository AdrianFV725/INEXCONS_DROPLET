import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  BanknotesIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import prospectoService from '../../services/prospectoService';
import { formatDate, formatCurrency } from '../../utils/formatters';

export default function ProspectoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prospecto, setProspecto] = useState(null);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [currentNota, setCurrentNota] = useState(null);
  const [notaFormData, setNotaFormData] = useState({
    contenido: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [prospectoFormData, setProspectoFormData] = useState({
    nombre: '',
    descripcion: '',
    cliente: '',
    ubicacion: '',
    presupuesto_estimado: '',
    fecha_estimada_inicio: '',
    estado: 'pendiente',
    montoTotal: '',
    porcentajeIva: '16',
    iva: '',
    fechaFinalizacion: '',
    anticipo: ''
  });
  // Estado para el modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Estado para el modal de confirmación de eliminación de nota
  const [showDeleteNotaModal, setShowDeleteNotaModal] = useState(false);
  const [notaToDelete, setNotaToDelete] = useState(null);
  // Estado para el modal de conversión a proyecto
  const [convertingToProject, setConvertingToProject] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Calcular IVA cuando cambia el monto total o el porcentaje de IVA
  useEffect(() => {
    if (prospectoFormData.montoTotal && prospectoFormData.porcentajeIva) {
      const montoTotal = parseFloat(prospectoFormData.montoTotal) || 0;
      const porcentajeIva = parseFloat(prospectoFormData.porcentajeIva) || 0;
      const ivaCalculado = (montoTotal * porcentajeIva / 100).toFixed(2);
      
      setProspectoFormData(prev => ({
        ...prev,
        iva: ivaCalculado
      }));
    }
  }, [prospectoFormData.montoTotal, prospectoFormData.porcentajeIva]);

  // Cargar datos del prospecto y sus notas
  const loadProspecto = async () => {
    try {
      setLoading(true);
      const data = await prospectoService.getById(id);
      setProspecto(data);
      setNotas(data.notas || []);
      
      // Inicializar formulario de edición
      setProspectoFormData({
        nombre: data.nombre,
        descripcion: data.descripcion || '',
        cliente: data.cliente || '',
        ubicacion: data.ubicacion || '',
        presupuesto_estimado: data.presupuesto_estimado || '',
        fecha_estimada_inicio: data.fecha_estimada_inicio ? data.fecha_estimada_inicio.split('T')[0] : '',
        estado: data.estado,
        montoTotal: data.montoTotal || data.presupuesto_estimado || '',
        porcentajeIva: data.porcentajeIva || '16',
        iva: data.iva || '',
        fechaFinalizacion: data.fechaFinalizacion ? data.fechaFinalizacion.split('T')[0] : '',
        anticipo: data.anticipo || ''
      });
      
      setError(null);
    } catch (err) {
      console.error(`Error al cargar prospecto con ID ${id}:`, err);
      setError('Error al cargar el prospecto. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProspecto();
  }, [id]);

  // Manejar cambios en el formulario de notas
  const handleNotaChange = (e) => {
    const { name, value } = e.target;
    setNotaFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en el formulario de prospecto
  const handleProspectoChange = (e) => {
    const { name, value } = e.target;
    setProspectoFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Abrir modal para crear nueva nota
  const openCreateNotaModal = () => {
    setCurrentNota(null);
    setNotaFormData({
      contenido: ''
    });
    setShowNotaModal(true);
  };

  // Abrir modal para editar nota
  const openEditNotaModal = (nota) => {
    setCurrentNota(nota);
    setNotaFormData({
      contenido: nota.contenido
    });
    setShowNotaModal(true);
  };

  // Guardar nota (crear o actualizar)
  const handleNotaSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (currentNota) {
        // Actualizar nota existente
        await prospectoService.updateNota(id, currentNota.id, notaFormData);
      } else {
        // Crear nueva nota
        await prospectoService.createNota(id, notaFormData);
      }
      
      setShowNotaModal(false);
      loadProspecto();
    } catch (err) {
      console.error('Error al guardar nota:', err);
      setError('Error al guardar la nota. Por favor, intenta de nuevo.');
    }
  };

  // Abrir modal de confirmación para eliminar nota
  const openDeleteNotaModal = (nota) => {
    setNotaToDelete(nota);
    setShowDeleteNotaModal(true);
  };

  // Confirmar eliminación de nota
  const confirmDeleteNota = async () => {
    if (!notaToDelete) return;
    
    try {
      await prospectoService.deleteNota(id, notaToDelete.id);
      setShowDeleteNotaModal(false);
      setNotaToDelete(null);
      loadProspecto();
    } catch (err) {
      console.error(`Error al eliminar nota con ID ${notaToDelete.id}:`, err);
      setError('Error al eliminar la nota. Por favor, intenta de nuevo.');
    }
  };

  // Guardar cambios en el prospecto
  const handleProspectoSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await prospectoService.update(id, prospectoFormData);
      setShowEditModal(false);
      loadProspecto();
    } catch (err) {
      console.error('Error al actualizar prospecto:', err);
      setError('Error al actualizar el prospecto. Por favor, intenta de nuevo.');
    }
  };

  // Abrir modal de confirmación de eliminación
  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  // Cerrar modal de confirmación de eliminación
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  // Eliminar prospecto
  const handleDeleteProspecto = async () => {
    try {
      await prospectoService.delete(id);
      navigate('/admin/prospectos');
    } catch (err) {
      console.error(`Error al eliminar prospecto con ID ${id}:`, err);
      setError('Error al eliminar el prospecto. Por favor, intenta de nuevo.');
      closeDeleteModal();
    }
  };

  // Obtener etiqueta de estado
  const getEstadoLabel = (estado) => {
    const estados = {
      pendiente: { text: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' },
      en_seguimiento: { text: 'En Seguimiento', class: 'bg-blue-100 text-blue-800' },
      convertido: { text: 'Convertido', class: 'bg-green-100 text-green-800' },
      cancelado: { text: 'Cancelado', class: 'bg-red-100 text-red-800' }
    };
    
    return estados[estado] || { text: estado, class: 'bg-gray-100 text-gray-800' };
  };

  // Función para convertir el prospecto a proyecto
  const handleConvertToProject = async () => {
    try {
      setConvertingToProject(true);
      const result = await prospectoService.convertToProject(id);
      setShowConvertModal(false);
      // Redirigir a la página de detalles del nuevo proyecto
      navigate(`/admin/proyectos/${result.projectId}`);
    } catch (err) {
      console.error('Error al convertir prospecto a proyecto:', err);
      setError('Error al convertir el prospecto a proyecto. Por favor, intenta de nuevo.');
    } finally {
      setConvertingToProject(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!prospecto) {
    return (
      <div className="text-center py-10">
        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontró el prospecto</h3>
        <p className="mt-1 text-sm text-gray-500">El prospecto solicitado no existe o ha sido eliminado.</p>
        <div className="mt-6">
          <Link
            to="/admin/prospectos"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <ArrowLeftIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Volver a Prospectos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado con acciones */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center min-w-0">
            <Link
              to="/admin/prospectos"
              className="mr-4 rounded-full bg-gray-100 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors flex-shrink-0"
            >
              <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{prospecto.nombre}</h1>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 ${getEstadoLabel(prospecto.estado).class}`}>
                  {getEstadoLabel(prospecto.estado).text}
                </span>
                {prospecto.descripcion && (
                  <span className="text-sm text-gray-500 truncate">{prospecto.descripcion}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {prospecto.estado === 'convertido' && (
              <button
                type="button"
                onClick={() => setShowConvertModal(true)}
                className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors"
              >
                <ArrowRightIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Convertir a Proyecto
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
            >
              <PencilIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
              Editar
            </button>
            <button
              type="button"
              onClick={openDeleteModal}
              className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
            >
              <TrashIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Información del Prospecto */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-indigo-500 mr-2" />
            <h3 className="text-lg font-medium leading-6 text-gray-900">Información del Prospecto</h3>
          </div>
        </div>
        <div className="px-6 py-6">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                Cliente
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {prospecto.cliente || 'No especificado'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                Ubicación
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {prospecto.ubicacion || 'No especificada'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                Presupuesto Estimado
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {prospecto.presupuesto_estimado ? formatCurrency(prospecto.presupuesto_estimado) : 'No especificado'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                Fecha Estimada de Inicio
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {prospecto.fecha_estimada_inicio ? formatDate(prospecto.fecha_estimada_inicio) : 'No especificada'}
              </dd>
            </div>

            {/* Información detallada para proyecto */}
            {(prospecto.montoTotal || prospecto.iva || prospecto.fechaFinalizacion || prospecto.anticipo) && (
              <>
                <div className="sm:col-span-full border-t pt-6 mt-2">
                  <dt className="text-base font-medium text-gray-900 flex items-center mb-4">
                    <BuildingOfficeIcon className="h-6 w-6 text-indigo-500 mr-2" />
                    Información para Proyecto
                  </dt>
                </div>
                {prospecto.montoTotal && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                      <BanknotesIcon className="h-5 w-5 text-gray-400 mr-2" />
                      Monto Total
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatCurrency(prospecto.montoTotal)}
                    </dd>
                  </div>
                )}
                {prospecto.iva && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                      <CheckCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                      IVA
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatCurrency(prospecto.iva)}
                    </dd>
                  </div>
                )}
                {prospecto.porcentajeIva && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                      <CheckCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                      Porcentaje de IVA
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {prospecto.porcentajeIva}%
                    </dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </div>
      </div>

      {/* Notas */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-indigo-500 mr-2" />
            <h3 className="text-lg font-medium leading-6 text-gray-900">Notas</h3>
            <p className="ml-2 text-sm text-gray-500">Seguimiento y observaciones</p>
          </div>
          <button
            type="button"
            onClick={openCreateNotaModal}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            Nueva Nota
          </button>
        </div>
        
        {notas.length === 0 ? (
          <div className="px-6 py-12 text-center border-b border-gray-200">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay notas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza añadiendo una nueva nota al prospecto.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={openCreateNotaModal}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                Nueva Nota
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notas.map(nota => (
              <div key={nota.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{nota.contenido}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(nota.created_at)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditNotaModal(nota)}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteNotaModal(nota)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para crear/editar nota - mantener el código existente */}
      {showNotaModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {currentNota ? 'Editar Nota' : 'Nueva Nota'}
                  </h3>
                </div>
              </div>
              <form onSubmit={handleNotaSubmit} className="mt-5 sm:mt-6">
                <div>
                  <label htmlFor="contenido" className="block text-sm font-medium text-gray-700">
                    Contenido *
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="contenido"
                      name="contenido"
                      rows={4}
                      required
                      value={notaFormData.contenido}
                      onChange={handleNotaChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNotaModal(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de prospecto */}
      {showEditModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
              <div className="mb-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold leading-6 text-gray-900">
                    Editar Prospecto
                  </h3>
                </div>
              </div>
              <form onSubmit={handleProspectoSubmit} className="space-y-8">
                {/* Información Básica */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-base font-medium text-gray-900 mb-4">Información Básica</h4>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          name="nombre"
                          id="nombre"
                          required
                          value={prospectoFormData.nombre}
                          onChange={handleProspectoChange}
                          className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Nombre del prospecto"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                      </label>
                      <textarea
                        id="descripcion"
                        name="descripcion"
                        rows={3}
                        value={prospectoFormData.descripcion}
                        onChange={handleProspectoChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Descripción del prospecto"
                      />
                    </div>
                  </div>
                </div>

                {/* Información del Cliente */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-base font-medium text-gray-900 mb-4">Información del Cliente</h4>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-1">
                        Cliente
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          name="cliente"
                          id="cliente"
                          value={prospectoFormData.cliente}
                          onChange={handleProspectoChange}
                          className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Nombre del cliente"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700 mb-1">
                        Ubicación
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          name="ubicacion"
                          id="ubicacion"
                          value={prospectoFormData.ubicacion}
                          onChange={handleProspectoChange}
                          className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Ubicación del proyecto"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información Financiera */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-base font-medium text-gray-900 mb-4">Información Financiera</h4>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="presupuesto_estimado" className="block text-sm font-medium text-gray-700 mb-1">
                        Presupuesto Estimado
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <CurrencyDollarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="number"
                          name="presupuesto_estimado"
                          id="presupuesto_estimado"
                          step="0.01"
                          min="0"
                          value={prospectoFormData.presupuesto_estimado}
                          onChange={handleProspectoChange}
                          className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="montoTotal" className="block text-sm font-medium text-gray-700 mb-1">
                        Monto Total
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <CurrencyDollarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="number"
                          name="montoTotal"
                          id="montoTotal"
                          value={prospectoFormData.montoTotal}
                          onChange={handleProspectoChange}
                          className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="porcentajeIva" className="block text-sm font-medium text-gray-700 mb-1">
                        Porcentaje de IVA
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <select
                          name="porcentajeIva"
                          id="porcentajeIva"
                          value={prospectoFormData.porcentajeIva}
                          onChange={handleProspectoChange}
                          className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="8">8%</option>
                          <option value="16">16%</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="iva" className="block text-sm font-medium text-gray-700 mb-1">
                        IVA Calculado
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <CurrencyDollarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          name="iva"
                          id="iva"
                          value={prospectoFormData.iva}
                          readOnly
                          className="block w-full rounded-md border-gray-300 bg-gray-50 pl-10 sm:text-sm"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {prospectoFormData.porcentajeIva}% del monto total
                      </p>
                    </div>

                    <div>
                      <label htmlFor="anticipo" className="block text-sm font-medium text-gray-700 mb-1">
                        Anticipo
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <CurrencyDollarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="number"
                          name="anticipo"
                          id="anticipo"
                          value={prospectoFormData.anticipo}
                          onChange={handleProspectoChange}
                          className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estado y Fechas */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-base font-medium text-gray-900 mb-4">Estado y Fechas</h4>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <select
                        id="estado"
                        name="estado"
                        value={prospectoFormData.estado}
                        onChange={handleProspectoChange}
                        className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_seguimiento">En Seguimiento</option>
                        <option value="convertido">Convertido</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="fecha_estimada_inicio" className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Estimada de Inicio
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="date"
                          name="fecha_estimada_inicio"
                          id="fecha_estimada_inicio"
                          value={prospectoFormData.fecha_estimada_inicio}
                          onChange={handleProspectoChange}
                          className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="fechaFinalizacion" className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Finalización
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="date"
                          name="fechaFinalizacion"
                          id="fechaFinalizacion"
                          value={prospectoFormData.fechaFinalizacion}
                          onChange={handleProspectoChange}
                          className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
                      Eliminar prospecto
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de eliminar este prospecto? Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteProspecto}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación de nota */}
      {showDeleteNotaModal && (
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
                      Eliminar nota
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas eliminar esta nota? Esta acción no se puede deshacer.
                      </p>
                      {notaToDelete && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700 line-clamp-3">
                            "{notaToDelete.contenido}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDeleteNota}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteNotaModal(false);
                    setNotaToDelete(null);
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

      {/* Modal de confirmación para convertir a proyecto */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                <ArrowRightIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Convertir a Proyecto
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    ¿Estás seguro de que deseas convertir este prospecto en un proyecto? 
                    Se creará un nuevo proyecto con la información del prospecto.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                disabled={convertingToProject}
                onClick={handleConvertToProject}
                className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto"
              >
                {convertingToProject ? 'Convirtiendo...' : 'Convertir'}
              </button>
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 