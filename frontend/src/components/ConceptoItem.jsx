import { useState } from 'react';
import { PlusIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

const ConceptoItem = ({ concepto, onAddPayment, onEdit, onDelete, onDeletePayment }) => {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [pagoToDelete, setPagoToDelete] = useState(null);

  // Calcular el total pagado
  const totalPagado = concepto.pagos.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);
  
  // Calcular el saldo pendiente
  const saldoPendiente = parseFloat(concepto.monto_total) - totalPagado;

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0 // Eliminar decimales para ahorrar espacio
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-MX', options);
  };

  // Manejar clic en el encabezado sin propagar al botón de editar o eliminar
  const handleHeaderClick = (e) => {
    // Si el clic no viene de los botones de acción
    if (!e.target.closest('.action-buttons')) {
      setExpanded(!expanded);
    }
  };

  const handleDeletePago = (pago) => {
    setPagoToDelete(pago);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeletePago = () => {
    onDeletePayment(concepto.id, pagoToDelete.id);
    setShowDeleteConfirmModal(false);
    setPagoToDelete(null);
  };

  const porcentajePagado = (totalPagado / concepto.monto_total) * 100;

  return (
    <div 
      className="border rounded-lg overflow-hidden mb-2 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={handleHeaderClick}
    >
      <div className="p-2 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50">
        {/* Información principal del concepto */}
        <div className="flex-1 w-full mb-2 sm:mb-0">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-900 flex-1">{concepto.nombre}</h3>
            {/* Botones de acción para móvil - ahora más grandes y espaciados */}
            <div className="flex items-center space-x-2 sm:hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(concepto);
                }}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none"
                title="Editar concepto"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(concepto.id);
                }}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600 focus:outline-none"
                title="Eliminar concepto"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none"
                title="Ver detalles"
              >
                {expanded ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
            <div className="flex-1 mb-3 sm:mb-0 sm:mr-6">
              <div className="flex items-center justify-between sm:justify-start sm:space-x-3 mb-2">
                <h4 className="text-sm font-medium text-gray-900">
                  {concepto.descripcion}
                </h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {concepto.pagos?.length || 0} pagos
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
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(concepto.monto_total)}</p>
                </div>
                <div className="bg-green-50 p-2 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase mb-0.5">Pagado</p>
                  <p className="text-sm font-medium text-green-600">{formatCurrency(totalPagado)}</p>
                </div>
                <div className="bg-red-50 p-2 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase mb-0.5">Pendiente</p>
                  <p className="text-sm font-medium text-red-600">{formatCurrency(saldoPendiente)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Vista de escritorio - montos y botones */}
        <div className="hidden sm:flex sm:items-center space-x-4">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-xs text-gray-500">Total:</p>
              <p className="text-sm font-medium text-gray-900">{formatCurrency(concepto.monto_total)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pagado:</p>
              <p className="text-sm font-medium text-green-600">{formatCurrency(totalPagado)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pendiente:</p>
              <p className="text-sm font-medium text-red-600">{formatCurrency(saldoPendiente)}</p>
            </div>
          </div>
          
          <div className="action-buttons flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(concepto);
              }}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none"
              title="Editar concepto"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(concepto.id);
              }}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-red-600 focus:outline-none"
              title="Eliminar concepto"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none"
              title="Ver detalles"
            >
              {expanded ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 p-2 bg-gray-50">
          <div className="mb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <h4 className="text-xs font-medium text-gray-700 mb-2 sm:mb-0">Pagos registrados</h4>
            <button
              onClick={() => onAddPayment(concepto.id)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Agregar pago
            </button>
          </div>

          {concepto.pagos.length > 0 ? (
            <div className="overflow-x-auto rounded-lg shadow">
              {/* Tabla para pantallas medianas y grandes */}
              <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {concepto.pagos.map((pago) => (
                    <tr key={pago.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {formatDate(pago.fecha)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 break-all">
                        {formatCurrency(pago.monto)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {pago.descripcion || "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <span className={`px-1.5 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded-full ${pago.es_anticipo ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {pago.es_anticipo ? 'Anticipo' : 'Pago'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePago(pago);
                          }}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <TrashIcon className="h-3 w-3 mr-0.5" />
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Vista de tarjetas para móviles - Mejorada */}
              <div className="sm:hidden bg-white divide-y divide-gray-200">
                {concepto.pagos.map((pago) => (
                  <div key={pago.id} className="p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                            pago.es_anticipo ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {pago.es_anticipo ? 'Anticipo' : 'Pago'}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(pago.monto)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(pago.fecha)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePago(pago);
                        }}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                    {pago.descripcion && (
                      <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded-lg">
                        {pago.descripcion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-4 bg-white rounded-lg shadow-inner">
              No hay pagos registrados
            </p>
          )}
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirmModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteConfirmModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Eliminar Pago
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro que deseas eliminar este pago? Esta acción no se puede deshacer.
                      </p>
                      {pagoToDelete && (
                        <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Monto:</span> {formatCurrency(pagoToDelete.monto)}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Fecha:</span> {formatDate(pagoToDelete.fecha)}
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
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDeletePago}
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
      )}
    </div>
  );
};

export default ConceptoItem; 