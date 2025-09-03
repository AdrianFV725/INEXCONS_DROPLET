import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { contractorService } from '../../services/contractorService'
import { projectService } from '../../services/projectService'
import { especialidadService } from '../../services/especialidadService'
import { DocumentPlusIcon, PlusIcon } from '@heroicons/react/24/outline'

const ContratistaFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [contractor, setContractor] = useState({
    nombre: '',
    rfc: '',
    telefono: '',
    especialidad_id: '',
    documentos: [],
    proyectos: [],
  })
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [availableProjects, setAvailableProjects] = useState([])
  const [selectedProjects, setSelectedProjects] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  
  // Estilo personalizado para el select de especialidades
  const selectStyles = {
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  }
  
  // Estilo para las opciones del select
  const optionStyles = {
    whiteSpace: 'normal',
    overflow: 'visible'
  }

  useEffect(() => {
    loadProjects()
    loadEspecialidades()
    if (id) {
      loadContractor()
    }
  }, [id])

  const loadContractor = async () => {
    try {
      const data = await contractorService.getById(id)
      setContractor({
        ...data,
        especialidad_id: data.especialidad_id || ''
      })
      if (data.documentos) {
        setPreviewUrls(data.documentos.map(doc => doc.url))
      }
      if (data.proyectos) {
        setSelectedProjects(data.proyectos.map(p => p.id))
      }
    } catch (err) {
      setError('Error al cargar el contratista')
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

  const loadEspecialidades = async () => {
    try {
      const data = await especialidadService.getAll()
      setEspecialidades(data)
    } catch (err) {
      console.error('Error al cargar especialidades:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validar campos obligatorios
    if (!contractor.nombre || contractor.nombre.trim() === '') {
      setError('El campo Nombre / Razón Social es obligatorio')
      setIsLoading(false)
      return
    }

    if (!contractor.rfc || contractor.rfc.trim() === '') {
      setError('El campo RFC es obligatorio')
      setIsLoading(false)
      return
    }

    if (!contractor.telefono || contractor.telefono.trim() === '') {
      setError('El campo Teléfono es obligatorio')
      setIsLoading(false)
      return
    }

    try {
      const formData = new FormData()
      
      // Agregar campos básicos
      formData.append('nombre', contractor.nombre.trim())
      formData.append('rfc', contractor.rfc.trim())
      formData.append('telefono', contractor.telefono.trim())
      formData.append('especialidad_id', contractor.especialidad_id)
      
      // Agregar proyectos seleccionados
      if (selectedProjects.length > 0) {
        formData.append('proyectos', JSON.stringify(selectedProjects))
      }
      
      // Agregar documentos
      if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formData.append('documentos[]', file)
        })
      }

      // Depuración: mostrar los datos que se van a enviar
      console.log('Datos a enviar:')
      console.log('nombre:', contractor.nombre)
      console.log('rfc:', contractor.rfc)
      console.log('telefono:', contractor.telefono)
      console.log('especialidad_id:', contractor.especialidad_id)
      console.log('proyectos:', selectedProjects)
      console.log('documentos:', selectedFiles)

      if (id) {
        await contractorService.update(id, formData)
      } else {
        await contractorService.create(formData)
      }
      navigate('/admin/contratistas')
    } catch (err) {
      console.error('Error completo:', err)
      if (err.response) {
        console.error('Respuesta del servidor:', err.response.data)
      }
      
      if (err.response && err.response.data && err.response.data.error) {
        setError(`Error al guardar el contratista: ${err.response.data.error}`)
      } else if (err.response && err.response.status === 401) {
        setError('Sesión expirada. Por favor, inicie sesión nuevamente.')
      } else {
        setError('Error al guardar el contratista. Por favor, inténtelo de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Convertir RFC a mayúsculas
    const processedValue = name === 'rfc' ? value.toUpperCase() : value
    
    setContractor((prev) => ({
      ...prev,
      [name]: processedValue,
    }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles((prevFiles) => [...prevFiles, ...files])

    // Crear URLs para previsualización
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file))
    setPreviewUrls((prevUrls) => [...prevUrls, ...newPreviewUrls])
  }

  const handleRemoveFile = (index) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
    setPreviewUrls((prevUrls) => {
      const newUrls = prevUrls.filter((_, i) => i !== index)
      URL.revokeObjectURL(prevUrls[index])
      return newUrls
    })
  }

  const handleRemoveExistingFile = async (documentId) => {
    if (window.confirm('¿Estás seguro de eliminar este documento?')) {
      try {
        await contractorService.deleteDocument(id, documentId)
        loadContractor()
      } catch (err) {
        setError('Error al eliminar el documento')
        console.error('Error:', err)
      }
    }
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

  return (
    <div className="px-4 sm:px-0">
      <div className="md:flex md:items-center md:justify-between mb-4 sm:mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold leading-7 text-gray-900 sm:truncate">
            {id ? 'Editar Contratista' : 'Nuevo Contratista'}
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
                Nombre / Razón Social
              </label>
              <input
                type="text"
                name="nombre"
                id="nombre"
                required
                value={contractor.nombre}
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
                required
                value={contractor.rfc}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase"
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
                value={contractor.telefono}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="col-span-1">
              <label
                htmlFor="especialidad_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Especialidad
              </label>
              <div className="flex">
                <select
                  id="especialidad_id"
                  name="especialidad_id"
                  value={contractor.especialidad_id}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-ellipsis"
                  style={selectStyles}
                >
                  <option value="">Seleccionar especialidad</option>
                  {especialidades.map((especialidad) => (
                    <option 
                      key={especialidad.id} 
                      value={especialidad.id} 
                      title={especialidad.nombre}
                      style={optionStyles}
                    >
                      {especialidad.nombre}
                    </option>
                  ))}
                </select>
                <Link
                  to="/admin/especialidades"
                  className="ml-2 mt-1 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="-ml-0.5 mr-1 h-4 w-4" />
                  Gestionar
                </Link>
              </div>
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

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documentos
              </label>
              <div className="mt-1 flex justify-center px-4 sm:px-6 pt-4 pb-4 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-2 text-center">
                  <DocumentPlusIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="documentos"
                      className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Subir documentos</span>
                      <input
                        id="documentos"
                        name="documentos"
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">o arrastrar y soltar</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, hasta 10MB por archivo
                  </p>
                </div>
              </div>
            </div>

            {/* Previsualización de documentos existentes */}
            {contractor.documentos && contractor.documentos.length > 0 && (
              <div className="col-span-1">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Documentos existentes
                </h4>
                <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                  {contractor.documentos.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between py-2 px-3 sm:py-3 sm:px-4 text-sm"
                    >
                      <div className="flex items-center">
                        <DocumentPlusIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-900 truncate max-w-[150px] sm:max-w-xs">
                          {doc.nombre}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingFile(doc.id)}
                        className="ml-2 text-sm font-medium text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Previsualización de archivos seleccionados */}
            {selectedFiles.length > 0 && (
              <div className="col-span-1">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Archivos seleccionados
                </h4>
                <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                  {selectedFiles.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between py-2 px-3 sm:py-3 sm:px-4 text-sm"
                    >
                      <div className="flex items-center">
                        <DocumentPlusIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-900 truncate max-w-[150px] sm:max-w-xs">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="ml-2 text-sm font-medium text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
            onClick={() => navigate('/admin/contratistas')}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export default ContratistaFormPage 