/**
 * Formatea un valor numérico como moneda (MXN)
 * @param {number} value - El valor a formatear
 * @returns {string} - El valor formateado como moneda
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '$0.00';
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(value);
};

/**
 * Formatea una fecha en formato legible
 * @param {string} dateString - La fecha en formato ISO o string
 * @returns {string} - La fecha formateada
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

/**
 * Formatea una fecha en formato corto (DD/MM/YYYY)
 * @param {string} dateString - La fecha en formato ISO o string
 * @returns {string} - La fecha formateada
 */
export const formatShortDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}; 