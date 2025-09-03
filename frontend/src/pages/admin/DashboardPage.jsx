import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BriefcaseIcon,
  UserGroupIcon,
  UserIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChartBarIcon,
  CalendarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ReceiptPercentIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { projectService } from '../../services/projectService'
import { workerService } from '../../services/workerService'
import { contractorService } from '../../services/contractorService'
import { gastoGeneralService } from '../../services/gastoGeneralService'
import prospectoService from '../../services/prospectoService'
import nominaSemanalService from '../../services/nominaSemanalService'

// Función para obtener el número de semana
const getWeekNumber = (date) => {
  const currentDate = date || new Date();
  // Crear una copia de la fecha
  const d = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()));
  // Establecer a lunes de la semana
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Obtener el primer día del año
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calcular el número de semana
  const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNumber;
}

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalProyectos: 0,
    proyectosActivos: 0,
    totalTrabajadores: 0,
    totalContratistas: 0,
    montoTotal: 0,
    montoPendiente: 0,
    sueldoPromedio: 0,
    sueldoTotal: 0,
    montoTotalGastos: 0,
    balanceFinal: 0,
    pagosRecibidos: 0,
    pagosPendientes: 0,
    gastosContratistas: 0,
    gastosGenerales: 0,
    gastosOperativos: 0,
    gastosAdministrativos: 0,
    gastosOtros: 0,
    gastosInex: 0,
    gastosProyectos: 0,
    iva: 0,
    totalConIva: 0,
    totalConceptos: 0,
    totalPagado: 0,
    totalProspectos: 0
  })
  const [semanaActual, setSemanaActual] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    loadStats()
    loadSemanaActual()
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  const loadSemanaActual = async () => {
    try {
      const semana = await nominaSemanalService.getSemanaActual();
      setSemanaActual(semana);
    } catch (err) {
      console.error('Error al cargar semana actual:', err);
    }
  }

  const loadStats = async () => {
    try {
      setIsLoading(true);
      console.log('Cargando estadísticas...');
      
      const projectStats = await projectService.getStats();
      console.log('Estadísticas de proyectos:', projectStats);
      
      const workerStats = await workerService.getStats();
      console.log('Estadísticas de trabajadores:', workerStats);
      
      const contractorStats = await contractorService.getStats();
      console.log('Estadísticas de contratistas (raw):', contractorStats);
      console.log('Total de contratistas:', contractorStats.total);
      
      const gastosStats = await gastoGeneralService.getStats();
      console.log('Estadísticas de gastos:', gastosStats);

      const prospectoStats = await prospectoService.getStats();
      console.log('Estadísticas de prospectos:', prospectoStats);

      // Verificar si hay error en las estadísticas de contratistas
      if (contractorStats.error) {
        console.warn('Error en estadísticas de contratistas:', contractorStats.error);
      }

      const newStats = {
        totalProyectos: projectStats.total || 0,
        proyectosActivos: projectStats.activos || 0,
        totalTrabajadores: workerStats.total || 0,
        totalContratistas: contractorStats.total || 0,
        montoTotal: projectStats.montoTotal || 0,
        montoPendiente: projectStats.montoPendiente || 0,
        sueldoPromedio: workerStats.sueldoPromedio || 0,
        sueldoTotal: workerStats.sueldoTotal || 0,
        montoTotalGastos: gastosStats.monto_total_gastos || 0,
        balanceFinal: gastosStats.balance_final || 0,
        pagosRecibidos: projectStats.pagosRecibidos || 0,
        pagosPendientes: projectStats.pagosPendientes || 0,
        gastosContratistas: gastosStats.total_gastos_contratistas || 0,
        gastosGenerales: gastosStats.monto_total_gastos || 0,
        gastosOperativos: gastosStats.operativos || 0,
        gastosAdministrativos: gastosStats.administrativos || 0,
        gastosOtros: gastosStats.otros || 0,
        gastosInex: gastosStats.gastos_inex || 0,
        gastosProyectos: gastosStats.gastos_proyectos || 0,
        iva: projectStats.iva || 0,
        totalConIva: projectStats.totalConIva || 0,
        totalConceptos: contractorStats.totalConceptos || 0,
        totalPagado: contractorStats.totalPagado || 0,
        totalProspectos: prospectoStats.total || 0
      };

      console.log('Nuevas estadísticas a establecer:', newStats);
      setStats(newStats);
      console.log('Estado actualizado después de setStats:', newStats);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setIsLoading(false);
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className={`mb-8 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Estado de Resultados General
        </p>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 transition-all duration-700 delay-100 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        <div className={`bg-white rounded-xl shadow-sm p-6 border border-emerald-200 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`} style={{ transitionDelay: '200ms' }}>
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-emerald-50">
              <CurrencyDollarIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Facturación</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total con IVA</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalConIva)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Sin IVA</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(stats.montoTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">IVA</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(stats.iva)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl shadow-sm p-6 border border-blue-200 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`} style={{ transitionDelay: '300ms' }}>
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <BriefcaseIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Resumen General</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Proyectos Activos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.proyectosActivos}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Prospectos</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalProspectos || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Semana Actual</p>
              <p className="text-lg font-semibold text-gray-900">Semana {semanaActual?.numero_semana || '...'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Proyectos</p>
              <p className="text-lg font-semibold text-gray-900">{stats.totalProyectos}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 transition-all duration-700 delay-200 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        <div className={`bg-white rounded-xl shadow-sm p-6 border border-emerald-200 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`} style={{ transitionDelay: '400ms' }}>
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-lg bg-emerald-50">
              <ArrowTrendingUpIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Ingresos</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pagado por Clientes</span>
              <span className="text-sm font-semibold text-green-600">{formatCurrency(stats.pagosRecibidos)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pendiente por Cobrar</span>
              <span className="text-sm font-semibold text-amber-600">{formatCurrency(stats.pagosPendientes)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-900">Total Facturado</span>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(stats.totalConIva)}</span>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl shadow-sm p-6 border border-rose-200 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`} style={{ transitionDelay: '500ms' }}>
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-lg bg-rose-50">
              <ArrowTrendingDownIcon className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Gastos</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gastos INEX</span>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(stats.gastosInex)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gastos Proyectos</span>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(stats.gastosProyectos)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-900">Total Gastos Generales</span>
              <span className="text-sm font-bold text-red-600">{formatCurrency(stats.gastosInex + stats.gastosProyectos)}</span>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl shadow-sm p-6 border border-violet-200 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`} style={{ transitionDelay: '600ms' }}>
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-lg bg-violet-50">
              <BanknotesIcon className="h-6 w-6 text-violet-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Balance</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Ingresos</span>
              <span className="text-sm font-semibold text-green-600">{formatCurrency(stats.pagosRecibidos)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Gastos</span>
              <span className="text-sm font-semibold text-red-600">{formatCurrency(stats.gastosInex + stats.gastosProyectos)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-900">Balance Final</span>
              <span className={`text-sm font-bold ${stats.balanceFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.balanceFinal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-700 delay-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        <div className={`bg-white rounded-xl shadow-sm p-6 border border-amber-200 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`} style={{ transitionDelay: '700ms' }}>
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-lg bg-amber-50">
              <UserGroupIcon className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Trabajadores</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Trabajadores</span>
              <span className="text-sm font-semibold text-gray-900">{stats.totalTrabajadores}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Sueldos</span>
              <span className="text-sm font-semibold text-amber-600">{formatCurrency(stats.sueldoTotal)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-900">Sueldo Promedio</span>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(stats.sueldoPromedio)}</span>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl shadow-sm p-6 border border-cyan-200 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`} style={{ transitionDelay: '800ms' }}>
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-lg bg-cyan-50">
              <BuildingOfficeIcon className="h-6 w-6 text-cyan-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Contratistas</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Contratistas</span>
              <span className="text-sm font-semibold text-gray-900">{stats.totalContratistas}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Conceptos</span>
              <span className="text-sm font-semibold text-cyan-600">{formatCurrency(stats.totalConceptos)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Pagado</span>
              <span className="text-sm font-semibold text-cyan-600">{formatCurrency(stats.totalPagado)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-900">Promedio por Contratista</span>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(stats.totalContratistas ? stats.totalConceptos / stats.totalContratistas : 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage 