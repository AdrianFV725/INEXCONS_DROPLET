import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { contractorService } from '../../services/contractorService'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  BriefcaseIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowLeftIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

const ContratistaDashboardPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [id])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const data = await contractorService.getDashboard(id)
      setDashboardData(data)
    } catch (err) {
      setError('Error al cargar el dashboard del contratista')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (porcentaje) => {
    if (porcentaje >= 80) return 'bg-green-500'
    if (porcentaje >= 50) return 'bg-yellow-500'
    if (porcentaje >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getStatusTextColor = (porcentaje) => {
    if (porcentaje >= 80) return 'text-green-700'
    if (porcentaje >= 50) return 'text-yellow-700'
    if (porcentaje >= 25) return 'text-orange-700'
    return 'text-red-700'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/admin/contratistas')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver a Contratistas
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return <div>No hay datos disponibles</div>
  }

  const { contratista, resumen, estadisticas_por_proyecto, conceptos_con_avance, pagos_recientes, pagos_por_mes } = dashboardData

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/admin/contratistas/${id}`)}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Volver al detalle
              </button>
            </div>
            <button
              onClick={() => navigate(`/admin/contratistas/${id}`)}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              Ver Detalle
            </button>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard - {contratista.nombre}
            </h1>
            <p className="text-gray-600 mt-2">
              RFC: {contratista.rfc} • Teléfono: {contratista.telefono}
              {contratista.especialidad && (
                <span> • Especialidad: {contratista.especialidad.nombre}</span>
              )}
            </p>
          </div>
        </div>

        {/* Cards de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BriefcaseIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Proyectos</p>
                <p className="text-2xl font-semibold text-gray-900">{resumen.total_proyectos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Conceptos</p>
                <p className="text-2xl font-semibold text-gray-900">{resumen.total_conceptos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Pagado</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(resumen.total_pagado)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className={`h-8 w-8 ${getStatusTextColor(resumen.porcentaje_avance_general)}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avance General</p>
                <p className={`text-2xl font-semibold ${getStatusTextColor(resumen.porcentaje_avance_general)}`}>
                  {resumen.porcentaje_avance_general}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de progreso general */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Progreso General</h3>
            <span className="text-sm text-gray-500">
              {formatCurrency(resumen.total_pagado)} de {formatCurrency(resumen.monto_total_conceptos)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full ${getStatusColor(resumen.porcentaje_avance_general)}`}
              style={{ width: `${Math.min(resumen.porcentaje_avance_general, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Pendiente: {formatCurrency(resumen.saldo_pendiente)}</span>
            <span>{resumen.porcentaje_avance_general}% completado</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Estadísticas por Proyecto */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Estadísticas por Proyecto</h3>
            </div>
            <div className="p-6">
              {estadisticas_por_proyecto.length > 0 ? (
                <div className="space-y-4">
                  {estadisticas_por_proyecto.map((proyecto, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{proyecto.proyecto.nombre}</h4>
                          <p className="text-sm text-gray-500">{proyecto.total_conceptos} conceptos</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusTextColor(proyecto.porcentaje_avance)} bg-gray-100`}>
                          {proyecto.porcentaje_avance}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full ${getStatusColor(proyecto.porcentaje_avance)}`}
                          style={{ width: `${Math.min(proyecto.porcentaje_avance, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Pagado: {formatCurrency(proyecto.pagado)}</span>
                        <span>Pendiente: {formatCurrency(proyecto.pendiente)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay proyectos registrados</p>
              )}
            </div>
          </div>

          {/* Pagos por Mes */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Pagos por Mes (Últimos 6 meses)</h3>
            </div>
            <div className="p-6">
              {pagos_por_mes.length > 0 ? (
                <div className="space-y-3">
                  {pagos_por_mes.map((mes, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{mes.mes}</p>
                        <p className="text-sm text-gray-500">{mes.cantidad_pagos} pagos</p>
                      </div>
                      <p className="font-semibold text-green-600">{formatCurrency(mes.total)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay pagos registrados</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Conceptos con Avance */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Conceptos por Avance</h3>
            </div>
            <div className="p-6">
              {conceptos_con_avance.length > 0 ? (
                <div className="space-y-4">
                  {conceptos_con_avance.slice(0, 10).map((concepto, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{concepto.nombre}</h4>
                          <p className="text-sm text-gray-500">{concepto.proyecto}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusTextColor(concepto.porcentaje_avance)} bg-gray-100`}>
                          {concepto.porcentaje_avance}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full ${getStatusColor(concepto.porcentaje_avance)}`}
                          style={{ width: `${Math.min(concepto.porcentaje_avance, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Pagado: {formatCurrency(concepto.pagado)}</span>
                        <span>Total: {formatCurrency(concepto.monto_total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay conceptos registrados</p>
              )}
            </div>
          </div>

          {/* Pagos Recientes */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Pagos Recientes</h3>
            </div>
            <div className="p-6">
              {pagos_recientes.length > 0 ? (
                <div className="space-y-4">
                  {pagos_recientes.map((pago, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">{formatDate(pago.fecha)}</span>
                          {pago.es_anticipo && (
                            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Anticipo
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900">{pago.concepto.nombre}</p>
                        <p className="text-sm text-gray-500">{pago.proyecto.nombre}</p>
                        {pago.descripcion && (
                          <p className="text-sm text-gray-400 mt-1">{pago.descripcion}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(pago.monto)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay pagos recientes</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContratistaDashboardPage
