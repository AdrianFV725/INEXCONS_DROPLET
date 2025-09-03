import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { workerService } from '../../services/workerService'
import { projectService } from '../../services/projectService'
import { DocumentPlusIcon } from '@heroicons/react/24/outline'

const TrabajadorFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [worker, setWorker] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
    rfc: '',
    ine: '',
    fecha_contratacion: new Date().toISOString().split('T')[0],
    sueldo_base: '',
    proyectos: [],
  })
  const [ineFile, setIneFile] = useState(null)
  const [inePreview, setInePreview] = useState(null)
  const [availableProjects, setAvailableProjects] = useState([])
  const [selectedProjects, setSelectedProjects] = useState([])

  useEffect(() => {
    loadProjects()
    if (id) {
      loadWorker()
    }
  }, [id])

  // Limpiar las URLs de vista previa cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (inePreview) {
        URL.revokeObjectURL(inePreview)
      }
    }
  }, [inePreview])

  const loadWorker = async () => {
    try {
      const data = await workerService.getById(id)
      // Formatear la fecha de contratación para el campo de tipo date
      if (data.fecha_contratacion) {
        data.fecha_contratacion = new Date(data.fecha_contratacion).toISOString().split('T')[0]
      }
      setWorker(data)
      if (data.proyectos) {
        setSelectedProjects(data.proyectos.map(p => p.id))
      }
      // Si hay un documento INE, mostrar la vista previa
      if (data.ine_url) {
        setInePreview(data.ine_url)
      }
    } catch (err) {
      setError('Error al cargar el trabajador')
      console.error('Error:', err)
    }
  }

  const loadProjects = async () => {
    try {
      const data = await projectService.getAll()
      setAvailableProjects(data)
    } catch (err) {
      console.error('Error al cargar proyectos:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      
      // Agregar campos básicos
      formData.append('nombre', worker.nombre)
      formData.append('apellidos', worker.apellidos)
      formData.append('fecha_contratacion', worker.fecha_contratacion)
      formData.append('sueldo_base', worker.sueldo_base)
      formData.append('telefono', worker.telefono || '')
      formData.append('rfc', worker.rfc || '')
      
      // Agregar archivo INE si existe
      if (ineFile) {
        formData.append('ine_documento', ineFile)
      }
      
      let trabajadorId;
      
      if (id) {
        await workerService.update(id, formData)
        trabajadorId = id;
      } else {
        const nuevoTrabajador = await workerService.create(formData)
        trabajadorId = nuevoTrabajador.id;
      }
      
      if (trabajadorId) {
        const trabajadorActual = await workerService.getById(trabajadorId);
        const proyectosActuales = trabajadorActual.proyectos?.map(p => p.id) || [];
        
        for (const proyectoId of selectedProjects) {
          if (!proyectosActuales.includes(proyectoId)) {
            await workerService.assignToProject(trabajadorId, proyectoId);
          }
        }
        
        for (const proyectoId of proyectosActuales) {
          if (!selectedProjects.includes(proyectoId)) {
            await workerService.removeFromProject(trabajadorId, proyectoId);
          }
        }
      }
      
      navigate('/admin/trabajadores')
    } catch (err) {
      setError(err.message || 'Error al guardar el trabajador')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setWorker((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProjectChange = (projectId) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId)
      } else {
        return [...prev, projectId]
      }
    })
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setIneFile(file)
      setInePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveFile = () => {
    setIneFile(null)
    if (inePreview) {
      URL.revokeObjectURL(inePreview)
      setInePreview(null)
    }
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="md:flex md:items-center md:justify-between mb-4 sm:mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold leading-7 text-gray-900 sm:truncate">
            {id ? 'Editar Trabajador' : 'Nuevo Trabajador'}
          </h2>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 mb-4">
          <p className="text-sm sm:text-base text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="bg-white shadow rounded-lg px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="col-span-1">
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre(s)
              </label>
              <input
                type="text"
                name="nombre"
                id="nombre"
                required
                value={worker.nombre}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="col-span-1">
              <label
                htmlFor="apellidos"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Apellidos
              </label>
              <input
                type="text"
                name="apellidos"
                id="apellidos"
                required
                value={worker.apellidos}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="col-span-1">
              <label
                htmlFor="telefono"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                id="telefono"
                required
                value={worker.telefono}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="col-span-1">
              <label
                htmlFor="rfc"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                RFC
              </label>
              <input
                type="text"
                name="rfc"
                id="rfc"
                value={worker.rfc}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="col-span-1">
              <label
                htmlFor="ine"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                INE (Documento)
              </label>
              <div className="mt-1 flex justify-center px-4 py-4 border-2 border-gray-300 border-dashed rounded-md">
                {inePreview ? (
                  <div className="relative">
                    <div className="flex items-center justify-center">
                      <DocumentPlusIcon className="h-10 w-10 text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">
                        {ineFile ? ineFile.name : 'Documento cargado'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 text-center">
                    <DocumentPlusIcon className="mx-auto h-10 w-10 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="ine-file"
                        className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Subir documento</span>
                        <input
                          id="ine-file"
                          name="ine-file"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">o arrastrar y soltar</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF o imagen, hasta 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-1">
              <label
                htmlFor="fecha_contratacion"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Fecha de Contratación
              </label>
              <input
                type="date"
                name="fecha_contratacion"
                id="fecha_contratacion"
                required
                value={worker.fecha_contratacion}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="col-span-1">
              <label
                htmlFor="sueldo_base"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Sueldo Base
              </label>
              <input
                type="number"
                name="sueldo_base"
                id="sueldo_base"
                required
                min="0"
                step="0.01"
                value={worker.sueldo_base}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proyectos
              </label>
              <div className="bg-white border border-gray-300 rounded-md shadow-sm max-h-48 sm:max-h-60 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {availableProjects.map((project) => (
                    <li key={project.id} className="p-3 sm:p-4 hover:bg-gray-50">
                      <label className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            checked={selectedProjects.includes(project.id)}
                            onChange={() => handleProjectChange(project.id)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-700">
                            {project.nombre}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {formatDate(project.fechaInicio)} -{' '}
                            {formatDate(project.fechaFinalizacion)}
                          </p>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row-reverse sm:justify-start gap-3 sm:gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/trabajadores')}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export default TrabajadorFormPage 