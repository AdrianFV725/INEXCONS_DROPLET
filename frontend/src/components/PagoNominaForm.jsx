import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  Autocomplete,
  CircularProgress,
  Typography,
  Divider,
  Paper
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';
import { Save, Cancel, Person, AttachMoney, EventNote, Description, Notes } from '@mui/icons-material';

import nominaSemanalService from '../services/nominaSemanalService';

const PagoNominaForm = ({ initialData, onSubmit, onCancel, isEdit }) => {
  const [formData, setFormData] = useState({
    trabajador_id: '',
    nombre_receptor: '',
    monto: '',
    fecha_pago: new Date(),
    concepto: '',
    estado: 'pendiente',
    observaciones: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [trabajadores, setTrabajadores] = useState([]);
  const [loadingTrabajadores, setLoadingTrabajadores] = useState(false);
  
  // Cargar trabajadores
  useEffect(() => {
    const fetchTrabajadores = async () => {
      setLoadingTrabajadores(true);
      try {
        const response = await nominaSemanalService.getTrabajadores();
        console.log('Trabajadores cargados:', response); // Log para debugging
        setTrabajadores(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Error al cargar trabajadores:', error);
      } finally {
        setLoadingTrabajadores(false);
      }
    };
    
    fetchTrabajadores();
  }, []);
  
  // Inicializar formulario con datos si se está editando
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        trabajador_id: initialData.trabajador_id || '',
        nombre_receptor: initialData.nombre_receptor || '',
        monto: initialData.monto ? parseFloat(initialData.monto).toString() : '',
        fecha_pago: initialData.fecha_pago ? new Date(initialData.fecha_pago) : new Date(),
        concepto: initialData.concepto || '',
        estado: initialData.estado || 'pendiente',
        observaciones: initialData.observaciones || ''
      });
    }
  }, [isEdit, initialData]);
  
  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpiar error si existe
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Manejar cambios en el trabajador seleccionado
  const handleTrabajadorChange = (event, newValue) => {
    if (newValue) {
      console.log('Trabajador seleccionado:', newValue); // Log para debugging
      setFormData({
        ...formData,
        trabajador_id: newValue.id,
        nombre_receptor: newValue.nombre_completo || '',
        monto: newValue.sueldo_base ? newValue.sueldo_base.toString() : '' // Convertir a string para el input
      });
      
      // Limpiar errores
      if (errors.trabajador_id) {
        setErrors({
          ...errors,
          trabajador_id: '',
          nombre_receptor: '',
          monto: ''
        });
      }
    } else {
      setFormData({
        ...formData,
        trabajador_id: '',
        nombre_receptor: '',
        monto: '' // Limpiar monto cuando se deselecciona el trabajador
      });
    }
  };
  
  // Manejar cambio de fecha
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      fecha_pago: date
    });
    
    // Limpiar error si existe
    if (errors.fecha_pago) {
      setErrors({
        ...errors,
        fecha_pago: ''
      });
    }
  };
  
  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre_receptor.trim()) {
      newErrors.nombre_receptor = 'El nombre del receptor es obligatorio';
    }
    
    if (!formData.monto) {
      newErrors.monto = 'El monto es obligatorio';
    } else if (isNaN(formData.monto) || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'El monto debe ser un número positivo';
    }
    
    if (!formData.fecha_pago) {
      newErrors.fecha_pago = 'La fecha de pago es obligatoria';
    }
    
    if (!formData.concepto.trim()) {
      newErrors.concepto = 'El concepto es obligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    // Formatear datos para enviar
    const dataToSubmit = {
      ...formData,
      monto: parseFloat(formData.monto)
    };
    
    try {
      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Error al guardar pago:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Encontrar trabajador seleccionado
  const findSelectedTrabajador = () => {
    if (!formData.trabajador_id || trabajadores.length === 0) return null;
    return trabajadores.find(t => t.id === formData.trabajador_id) || null;
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" component="h3" gutterBottom sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: 'primary.main'
        }}>
          <Person sx={{ mr: 1 }} /> 
          Información del Receptor
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              id="trabajador-select"
              options={trabajadores}
              getOptionLabel={(option) => option.nombre_completo || ''}
              loading={loadingTrabajadores}
              value={findSelectedTrabajador()}
              onChange={handleTrabajadorChange}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Seleccionar Trabajador (opcional)" 
                  variant="outlined"
                  error={!!errors.trabajador_id}
                  helperText={errors.trabajador_id}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {loadingTrabajadores ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="nombre_receptor"
              label="Nombre del Receptor"
              variant="outlined"
              value={formData.nombre_receptor}
              onChange={handleChange}
              error={!!errors.nombre_receptor}
              helperText={errors.nombre_receptor}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" component="h3" gutterBottom sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: 'primary.main'
        }}>
          <AttachMoney sx={{ mr: 1 }} /> 
          Detalles del Pago
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="monto"
              label="Monto"
              variant="outlined"
              value={formData.monto}
              onChange={handleChange}
              error={!!errors.monto}
              helperText={errors.monto}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha de Pago"
                value={formData.fecha_pago}
                onChange={handleDateChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.fecha_pago}
                    helperText={errors.fecha_pago}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <EventNote color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="concepto"
              label="Concepto"
              variant="outlined"
              value={formData.concepto}
              onChange={handleChange}
              error={!!errors.concepto}
              helperText={errors.concepto}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Description color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" error={!!errors.estado}>
              <InputLabel id="estado-label">Estado</InputLabel>
              <Select
                labelId="estado-label"
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                label="Estado"
              >
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="pagado">Pagado</MenuItem>
              </Select>
              {errors.estado && (
                <FormHelperText>{errors.estado}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="observaciones"
              label="Observaciones (opcional)"
              variant="outlined"
              multiline
              rows={3}
              value={formData.observaciones}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Notes color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Box>
      
      <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
        <Button 
          variant="outlined" 
          onClick={onCancel}
          startIcon={<Cancel />}
          sx={{ fontWeight: 500 }}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          disabled={loading}
          startIcon={<Save />}
          sx={{ 
            fontWeight: 500,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 3,
            }
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            isEdit ? 'Actualizar' : 'Guardar'
          )}
        </Button>
      </Box>
    </form>
  );
};

export default PagoNominaForm; 