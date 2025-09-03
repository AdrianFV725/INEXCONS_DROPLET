import { useState, useEffect } from 'react';

const ConceptoForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    monto_total: '',
    anticipo: '0'
  });

  const [errors, setErrors] = useState({});

  // Cargar datos iniciales si se está editando un concepto existente
  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || '',
        monto_total: initialData.monto_total.toString() || '',
        anticipo: initialData.anticipo ? initialData.anticipo.toString() : '0'
      });
    }
  }, [initialData]);

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
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    if (!formData.monto_total || parseFloat(formData.monto_total) <= 0) {
      newErrors.monto_total = 'El monto total debe ser mayor a 0';
    }
    
    if (formData.anticipo && parseFloat(formData.anticipo) < 0) {
      newErrors.anticipo = 'El anticipo no puede ser negativo';
    }

    if (formData.anticipo && parseFloat(formData.anticipo) > parseFloat(formData.monto_total)) {
      newErrors.anticipo = 'El anticipo no puede ser mayor al monto total';
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
        monto_total: parseFloat(formData.monto_total),
        anticipo: formData.anticipo ? parseFloat(formData.anticipo) : 0
      };
      
      // Si hay datos iniciales, estamos editando
      if (initialData) {
        dataToSubmit.id = initialData.id;
      }
      
      onSubmit(dataToSubmit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700">
          Nombre del concepto *
        </label>
        <div className="mt-2">
          <input
            type="text"
            name="nombre"
            id="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ingrese el nombre del concepto..."
            className={`block w-full rounded-lg border-0 py-3 ring-1 ring-inset ${
              errors.nombre 
                ? 'ring-red-300 text-red-900 placeholder-red-300 focus:ring-red-500' 
                : 'ring-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-600'
            } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
          />
        </div>
        {errors.nombre && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠️</span>
            {errors.nombre}
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
            placeholder="Ingrese una descripción detallada..."
            className="block w-full rounded-lg border-0 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div>
        <label htmlFor="monto_total" className="block text-sm font-semibold text-gray-700">
          Monto total *
        </label>
        <div className="mt-2 relative rounded-lg shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            name="monto_total"
            id="monto_total"
            step="0.01"
            min="0"
            value={formData.monto_total}
            onChange={handleChange}
            placeholder="0.00"
            className={`pl-7 block w-full rounded-lg border-0 py-3 ring-1 ring-inset ${
              errors.monto_total 
                ? 'ring-red-300 text-red-900 placeholder-red-300 focus:ring-red-500' 
                : 'ring-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-600'
            } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
          />
        </div>
        {errors.monto_total && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠️</span>
            {errors.monto_total}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="anticipo" className="block text-sm font-semibold text-gray-700">
          Anticipo
        </label>
        <div className="mt-2 relative rounded-lg shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            name="anticipo"
            id="anticipo"
            step="0.01"
            min="0"
            value={formData.anticipo}
            onChange={handleChange}
            placeholder="0.00"
            className={`pl-7 block w-full rounded-lg border-0 py-3 ring-1 ring-inset ${
              errors.anticipo 
                ? 'ring-red-300 text-red-900 placeholder-red-300 focus:ring-red-500' 
                : 'ring-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-600'
            } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
          />
        </div>
        {errors.anticipo && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠️</span>
            {errors.anticipo}
          </p>
        )}
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
          {initialData ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

export default ConceptoForm; 