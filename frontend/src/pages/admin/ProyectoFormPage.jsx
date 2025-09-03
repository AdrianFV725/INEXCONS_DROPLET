import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectService } from '../../services/projectService'
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  CalendarIcon,
  ArrowPathIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

const ProyectoFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [project, setProject] = useState({
    nombre: '',
    montoTotal: '',
    iva: '',
    fechaInicio: '',
    fechaFinalizacion: '',
    anticipo: '',
    porcentajeIva: '16', // Valor por defecto: 16%
    porcentajeIvaPersonalizado: '',
    isIvaPersonalizado: false,
  })

  useEffect(() => {
    if (id) {
      loadProject()
    }
  }, [id])

  // Efecto para calcular el IVA cuando cambia el monto total o el porcentaje de IVA
  useEffect(() => {
    if (project.montoTotal && project.porcentajeIva) {
      const montoTotal = parseFloat(project.montoTotal) || 0
      const porcentajeIva = parseFloat(project.porcentajeIva) || 0
      const ivaCalculado = (montoTotal * porcentajeIva / 100).toFixed(2)
      
      setProject(prev => ({
        ...prev,
        iva: ivaCalculado
      }))
    }
  }, [project.montoTotal, project.porcentajeIva])

  const loadProject = async () => {
    try {
      const data = await projectService.getById(id)
      // Calcular el porcentaje de IVA basado en los datos existentes
      const montoTotal = parseFloat(data.montoTotal) || 0
      const iva = parseFloat(data.iva) || 0
      const porcentajeIva = montoTotal > 0 ? Math.round((iva / montoTotal) * 100) : 16
      
      setProject({
        ...data,
        fechaInicio: data.fechaInicio.split('T')[0],
        fechaFinalizacion: data.fechaFinalizacion.split('T')[0],
        porcentajeIva: porcentajeIva.toString()
      })
    } catch (err) {
      setError('Error al cargar el proyecto')
      console.error('Error:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Crear una copia del proyecto sin el campo porcentajeIva
      const projectToSave = { 
        nombre: project.nombre,
        montoTotal: project.montoTotal,
        iva: project.iva,
        fechaInicio: project.fechaInicio,
        fechaFinalizacion: project.fechaFinalizacion,
        anticipo: project.anticipo
      }
      
      // Asegurémonos de que todos los valores numéricos sean strings
      if (typeof projectToSave.montoTotal === 'number') {
        projectToSave.montoTotal = projectToSave.montoTotal.toString();
      }
      
      if (typeof projectToSave.iva === 'number') {
        projectToSave.iva = projectToSave.iva.toString();
      }
      
      if (typeof projectToSave.anticipo === 'number') {
        projectToSave.anticipo = projectToSave.anticipo.toString();
      }

      if (id) {
        await projectService.update(id, projectToSave)
      } else {
        await projectService.create(projectToSave)
      }
      navigate('/admin/proyectos')
    } catch (err) {
      console.error('Error:', err)
      if (err.response && err.response.data && err.response.data.error) {
        setError(`Error al guardar el proyecto: ${err.response.data.error}`)
      } else if (err.response && err.response.status === 401) {
        setError('Sesión expirada. Por favor, inicie sesión nuevamente.')
        // Opcional: redirigir al login
        // setTimeout(() => navigate('/login'), 2000)
      } else {
        setError('Error al guardar el proyecto. Por favor, inténtelo de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setProject((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const calculateTotal = () => {
    const subtotal = parseFloat(project.montoTotal) || 0
    const iva = parseFloat(project.iva) || 0
    return (subtotal + iva).toFixed(2)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {id ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          </h2>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información General */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6 flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
              Información General
            </h3>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                  Nombre del Proyecto
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="nombre"
                    id="nombre"
                    required
                    value={project.nombre}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Ingrese el nombre del proyecto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información Financiera */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
              Información Financiera
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="montoTotal" className="block text-sm font-medium text-gray-700">
                  Monto Total
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="montoTotal"
                    id="montoTotal"
                    required
                    value={project.montoTotal}
                    onChange={handleChange}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    step="0.01"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">MXN</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="porcentajeIva" className="block text-sm font-medium text-gray-700">
                  Porcentaje de IVA
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <select
                    name="porcentajeIva"
                    id="porcentajeIva"
                    required
                    value={project.isIvaPersonalizado ? 'personalizado' : project.porcentajeIva}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'personalizado') {
                        setProject(prev => ({
                          ...prev,
                          isIvaPersonalizado: true,
                          porcentajeIva: project.porcentajeIvaPersonalizado || '0'
                        }));
                      } else {
                        setProject(prev => ({
                          ...prev,
                          isIvaPersonalizado: false,
                          porcentajeIva: value
                        }));
                      }
                    }}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="8">8%</option>
                    <option value="16">16%</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <CalculatorIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {project.isIvaPersonalizado && (
                  <div className="mt-2 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="porcentajeIvaPersonalizado"
                      id="porcentajeIvaPersonalizado"
                      required
                      value={project.porcentajeIvaPersonalizado}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProject(prev => ({
                          ...prev,
                          porcentajeIvaPersonalizado: value,
                          porcentajeIva: value
                        }));
                      }}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Ingrese el porcentaje"
                      step="0.01"
                      min="0"
                      max="100"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="iva" className="block text-sm font-medium text-gray-700">
                  IVA
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    name="iva"
                    id="iva"
                    required
                    value={project.iva}
                    readOnly
                    className="bg-gray-50 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">MXN</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {project.porcentajeIva}% del monto total
                </p>
              </div>

              <div>
                <label htmlFor="total" className="block text-sm font-medium text-gray-700">
                  Total con IVA
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    id="total"
                    disabled
                    value={calculateTotal()}
                    className="bg-gray-50 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">MXN</span>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="anticipo" className="block text-sm font-medium text-gray-700">
                  Anticipo
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="anticipo"
                    id="anticipo"
                    required
                    value={project.anticipo}
                    onChange={handleChange}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    step="0.01"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <BanknotesIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fechas */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6 flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
              Fechas del Proyecto
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700">
                  Fecha de Inicio
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="fechaInicio"
                    id="fechaInicio"
                    required
                    value={project.fechaInicio}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fechaFinalizacion" className="block text-sm font-medium text-gray-700">
                  Fecha de Finalización
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="fechaFinalizacion"
                    id="fechaFinalizacion"
                    required
                    value={project.fechaFinalizacion}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/proyectos')}
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

export default ProyectoFormPage 