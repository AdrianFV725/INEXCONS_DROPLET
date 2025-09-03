import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowPathIcon,
  UserIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import prospectoService from '../../services/prospectoService'

const ProspectoFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [prospecto, setProspecto] = useState({
    nombre: '',
    descripcion: '',
    cliente: '',
    ubicacion: '',
    presupuesto_estimado: '',
    fecha_estimada_inicio: '',
    estado: 'pendiente'
  })

  useEffect(() => {
    if (id) {
      loadProspecto()
    }
  }, [id])

  const loadProspecto = async () => {
    try {
      const data = await prospectoService.getById(id)
      setProspecto({
        ...data,
        fecha_estimada_inicio: data.fecha_estimada_inicio ? data.fecha_estimada_inicio.split('T')[0] : ''
      })
    } catch (err) {
      setError('Error al cargar el prospecto')
      console.error('Error:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (id) {
        await prospectoService.update(id, prospecto)
      } else {
        await prospectoService.create(prospecto)
      }
      navigate('/admin/prospectos')
    } catch (err) {
      console.error('Error:', err)
      if (err.response && err.response.data && err.response.data.error) {
        setError(`Error al guardar el prospecto: ${err.response.data.error}`)
      } else if (err.response && err.response.status === 401) {
        setError('Sesión expirada. Por favor, inicie sesión nuevamente.')
      } else {
        setError('Error al guardar el prospecto. Por favor, inténtelo de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setProspecto((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {id ? 'Editar Prospecto' : 'Nuevo Prospecto'}
          </h2>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Básica */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6 flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
              Información General
            </h3>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                  Nombre del Prospecto *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="nombre"
                    id="nombre"
                    required
                    value={prospecto.nombre}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Nombre del prospecto"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <div className="mt-1">
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    rows={3}
                    value={prospecto.descripcion}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Descripción detallada del prospecto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Cliente */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6 flex items-center">
              <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
              Información del Cliente
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="cliente" className="block text-sm font-medium text-gray-700">
                  Cliente
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="cliente"
                    id="cliente"
                    value={prospecto.cliente}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Nombre del cliente"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700">
                  Ubicación
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="ubicacion"
                    id="ubicacion"
                    value={prospecto.ubicacion}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Ubicación del proyecto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información Financiera y Fechas */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
              Información Financiera y Fechas
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="presupuesto_estimado" className="block text-sm font-medium text-gray-700">
                  Presupuesto Estimado
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="presupuesto_estimado"
                    id="presupuesto_estimado"
                    value={prospecto.presupuesto_estimado}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="0.00"
                    step="0.01"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 sm:text-sm">MXN</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="fecha_estimada_inicio" className="block text-sm font-medium text-gray-700">
                  Fecha Estimada de Inicio
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="date"
                    name="fecha_estimada_inicio"
                    id="fecha_estimada_inicio"
                    value={prospecto.fecha_estimada_inicio}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <TagIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <select
                    id="estado"
                    name="estado"
                    value={prospecto.estado}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_seguimiento">En Seguimiento</option>
                    <option value="convertido">Convertido</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/prospectos')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProspectoFormPage 