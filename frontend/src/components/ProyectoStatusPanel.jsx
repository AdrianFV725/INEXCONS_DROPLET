import React from 'react';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  BanknotesIcon, 
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline';

const ProyectoStatusPanel = ({ 
  project, 
  contratistasWithConceptos,
  gastosGenerales = [],
  formatCurrency 
}) => {
  if (!project) return null;

  // Formatear moneda con opciones personalizadas para móvil
  const formatCurrencyMobile = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0 // Eliminar decimales para ahorrar espacio
    }).format(amount);
  };

  // Calcular totales generales del proyecto
  const montoTotalProyecto = parseFloat(project.montoTotal || 0) + parseFloat(project.iva || 0);
  
  // Calcular pagos del cliente
  const pagosCliente = project.pagos ? project.pagos.filter(pago => !pago.concepto_id) : [];
  const totalPagadoCliente = pagosCliente.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);
  const totalPendienteCliente = montoTotalProyecto - totalPagadoCliente;
  const porcentajePagadoCliente = montoTotalProyecto > 0 ? (totalPagadoCliente / montoTotalProyecto) * 100 : 0;
  
  // Calcular totales de contratistas
  let totalContratistas = 0;
  let totalPagadoContratistas = 0;
  
  if (contratistasWithConceptos && contratistasWithConceptos.length > 0) {
    contratistasWithConceptos.forEach(item => {
      if (item.conceptos && item.conceptos.length > 0) {
        item.conceptos.forEach(concepto => {
          totalContratistas += parseFloat(concepto.monto_total || 0);
          const pagado = concepto.pagos.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);
          totalPagadoContratistas += pagado;
        });
      }
    });
  }
  
  // Calcular total de gastos generales
  const totalGastosGenerales = gastosGenerales.reduce((sum, gasto) => sum + parseFloat(gasto.monto || 0), 0);
  
  const totalPendienteContratistas = totalContratistas - totalPagadoContratistas;
  const porcentajePagadoContratistas = totalContratistas > 0 ? (totalPagadoContratistas / totalContratistas) * 100 : 0;
  
  // Calcular balance del proyecto (ganancia/pérdida) incluyendo gastos generales
  const balanceProyecto = montoTotalProyecto - totalContratistas - totalGastosGenerales;
  const balanceActual = totalPagadoCliente - totalPagadoContratistas - totalGastosGenerales;
  
  // Calcular porcentaje de avance financiero del proyecto
  const porcentajeAvanceFinanciero = montoTotalProyecto > 0 ? (totalPagadoCliente / montoTotalProyecto) * 100 : 0;
  
  // Determinar el estado del proyecto
  const determinarEstadoProyecto = () => {
    if (totalPendienteCliente <= 0 && totalPendienteContratistas <= 0) {
      return { 
        label: 'Completado', 
        color: 'green',
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
      };
    } else if (balanceActual < 0) {
      return { 
        label: 'En déficit', 
        color: 'red',
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
      };
    } else {
      return { 
        label: 'En progreso', 
        color: 'yellow',
        icon: <ClockIcon className="h-5 w-5 text-yellow-500" />
      };
    }
  };
  
  const estadoProyecto = determinarEstadoProyecto();

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          {estadoProyecto.icon}
          <span className="ml-2">Estado del Proyecto: <span className={`text-${estadoProyecto.color}-600`}>{estadoProyecto.label}</span></span>
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Resumen financiero y estado actual del proyecto
        </p>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sección de información general */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-base font-medium text-gray-900 mb-4">Información General</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <BanknotesIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Monto Total:</span>
                </div>
                <span className="text-sm font-medium break-all">{formatCurrencyMobile(montoTotalProyecto)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Costo Contratistas:</span>
                </div>
                <span className="text-sm font-medium break-all">{formatCurrencyMobile(totalContratistas)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <ReceiptPercentIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Gastos Generales:</span>
                </div>
                <span className="text-sm font-medium break-all">{formatCurrencyMobile(totalGastosGenerales)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Balance Proyectado:</span>
                </div>
                <span className={`text-sm font-medium break-all ${balanceProyecto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrencyMobile(balanceProyecto)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <ArrowTrendingDownIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Balance Actual:</span>
                </div>
                <span className={`text-sm font-medium break-all ${balanceActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrencyMobile(balanceActual)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Avance Financiero:</span>
                </div>
                <span className="text-sm font-medium">{porcentajeAvanceFinanciero.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          {/* Sección de pagos del cliente */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-base font-medium text-gray-900 mb-4">Pagos del Cliente</h4>
            
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Progreso de pagos</span>
                <span className="text-sm font-medium text-gray-700">{porcentajePagadoCliente.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${porcentajePagadoCliente}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Pagado</p>
                <p className="text-lg font-semibold text-blue-600 break-all">{formatCurrencyMobile(totalPagadoCliente)}</p>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Pendiente</p>
                <p className="text-lg font-semibold text-red-600 break-all">{formatCurrencyMobile(totalPendienteCliente)}</p>
              </div>
            </div>
          </div>
          
          {/* Sección de pagos a contratistas */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-base font-medium text-gray-900 mb-4">Pagos a Contratistas</h4>
            
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Progreso de pagos</span>
                <span className="text-sm font-medium text-gray-700">{porcentajePagadoContratistas.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${porcentajePagadoContratistas}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Pagado</p>
                <p className="text-lg font-semibold text-green-600 break-all">{formatCurrencyMobile(totalPagadoContratistas)}</p>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Pendiente</p>
                <p className="text-lg font-semibold text-red-600 break-all">{formatCurrencyMobile(totalPendienteContratistas)}</p>
              </div>
            </div>
          </div>
          
          {/* Sección de resumen de contratistas */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-base font-medium text-gray-900 mb-4">Resumen de Contratistas</h4>
            
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2">
              {contratistasWithConceptos && contratistasWithConceptos.map(item => {
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
                  <div key={item.contratista.id} className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-gray-900">{item.contratista.nombre}</p>
                      <p className="text-xs text-gray-500">{porcentajePagado.toFixed(1)}% pagado</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                      <div 
                        className="bg-purple-600 h-1.5 rounded-full" 
                        style={{ width: `${porcentajePagado}%` }}
                      ></div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between text-xs">
                      <span className="text-gray-500 break-all">Total: {formatCurrencyMobile(totalContratista)}</span>
                      <span className="text-red-500 break-all">Pendiente: {formatCurrencyMobile(totalPendienteContratista)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProyectoStatusPanel; 