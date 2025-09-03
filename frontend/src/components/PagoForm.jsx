import { useState } from 'react';

export const PagoForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Limpiar error cuando el usuario modifica el campo
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0';
    }
    
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es obligatoria';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Convertir valores numéricos
      const dataToSubmit = {
        ...formData,
        monto: parseFloat(formData.monto)
      };
      
      onSubmit(dataToSubmit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="monto" className="block text-sm font-semibold text-gray-700">
          Monto *
        </label>
        <div className="mt-2 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            name="monto"
            id="monto"
            step="0.01"
            min="0"
            value={formData.monto}
            onChange={handleChange}
            className={`pl-7 block w-full rounded-lg border-0 py-3 ring-1 ring-inset ${
              errors.monto 
                ? 'ring-red-300 text-red-900 placeholder-red-300 focus:ring-red-500' 
                : 'ring-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-600'
            } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
            placeholder="0.00"
          />
        </div>
        {errors.monto && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠️</span>
            {errors.monto}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="fecha" className="block text-sm font-semibold text-gray-700">
          Fecha *
        </label>
        <div className="mt-2">
          <input
            type="date"
            name="fecha"
            id="fecha"
            value={formData.fecha}
            onChange={handleChange}
            className={`block w-full rounded-lg border-0 py-3 ring-1 ring-inset ${
              errors.fecha 
                ? 'ring-red-300 text-red-900 focus:ring-red-500' 
                : 'ring-gray-300 text-gray-900 focus:ring-indigo-600'
            } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
          />
        </div>
        {errors.fecha && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠️</span>
            {errors.fecha}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-semibold text-gray-700">
          Descripción
        </label>
        <div className="mt-2">
          <textarea
            name="descripcion"
            id="descripcion"
            rows="3"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Ingrese una descripción del pago..."
            className="block w-full rounded-lg border-0 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Guardar
        </button>
      </div>
    </form>
  );
};

export default PagoForm; 