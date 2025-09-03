import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Tooltip,
  CircularProgress,
  Divider,
  Alert,
  Snackbar,
  InputAdornment
} from '@mui/material';
import { 
  CalendarMonth, 
  Add, 
  Edit, 
  Lock, 
  LockOpen, 
  Visibility, 
  ArrowForward, 
  PostAdd,
  SaveAlt,
  Today,
  Event,
  Search,
  Delete
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';

import nominaSemanalService from '../../services/nominaSemanalService';
import LoadingBackdrop from '../../components/LoadingBackdrop';

const NominasSemanalPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nominas, setNominas] = useState([]);
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());
  const [anioCustom, setAnioCustom] = useState('');
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [openGenerarDialog, setOpenGenerarDialog] = useState(false);
  const [anioGenerar, setAnioGenerar] = useState(new Date().getFullYear());
  const [openNominaDialog, setOpenNominaDialog] = useState(false);
  const [selectedNomina, setSelectedNomina] = useState(null);
  const [dialogAction, setDialogAction] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [semanaActual, setSemanaActual] = useState(null);
  const [nominasFiltradas, setNominasFiltradas] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [openEliminarAnioDialog, setOpenEliminarAnioDialog] = useState(false);
  const [anioEliminar, setAnioEliminar] = useState(null);

  // Organizar nóminas para mostrar la actual primero
  const organizarNominas = (nominasArray, semanaActualObj) => {
    if (!semanaActualObj || nominasArray.length === 0) {
      setNominasFiltradas(nominasArray.sort((a, b) => a.numero_semana - b.numero_semana));
      return;
    }

    // Separar la semana actual y ordenar el resto
    const semanasOrdenadas = nominasArray
      .map(nomina => ({
        ...nomina,
        // Solo marcar como actual si coincide exactamente con la semana actual
        esActual: nomina.id === semanaActualObj.id
      }))
      .sort((a, b) => a.numero_semana - b.numero_semana);
    
    // Encontrar la semana actual y moverla al principio
    const indexActual = semanasOrdenadas.findIndex(n => n.id === semanaActualObj.id);
    if (indexActual !== -1) {
      const semanaActual = semanasOrdenadas.splice(indexActual, 1)[0];
      semanasOrdenadas.unshift(semanaActual);
    }
    
    setNominasFiltradas(semanasOrdenadas);

    // Log para depuración
    console.log(`Semana actual organizada: ${semanaActualObj.numero_semana} del ${semanaActualObj.anio}`);
  };

  // Verificar y actualizar la semana actual
  const verificarSemanaActual = async () => {
    try {
      if (loading) return;
      
      const nuevaSemanaActual = await nominaSemanalService.getSemanaActual();
      if (nuevaSemanaActual) {
        // Verificar si es diferente a la semana actual que ya tenemos
        if (!semanaActual || nuevaSemanaActual.id !== semanaActual.id) {
          console.log(`Actualizando semana actual: Nueva semana ${nuevaSemanaActual.numero_semana}`);
          setSemanaActual(nuevaSemanaActual);
          
          // Actualizar nóminas si es el mismo año
          if (nuevaSemanaActual.anio === anioActual) {
            const nominasResponse = await nominaSemanalService.getAll(anioActual);
            if (nominasResponse) {
              const nominasArray = Array.isArray(nominasResponse) ? nominasResponse : [];
              setNominas(nominasArray);
              organizarNominas(nominasArray, nuevaSemanaActual);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al verificar semana actual:', error);
    }
  };

  // Hook useEffect principal
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const aniosResponse = await nominaSemanalService.getAniosDisponibles();
        if (aniosResponse && Array.isArray(aniosResponse)) {
          setAniosDisponibles(aniosResponse);
          
          // Si no hay años disponibles, no cargamos nóminas
          if (aniosResponse.length === 0) {
            setNominas([]);
            setLoading(false);
            return;
          }
        } else {
          setAniosDisponibles([]);
        }
        
        const nominasResponse = await nominaSemanalService.getAll(anioActual);
        if (nominasResponse) {
          const nominasArray = Array.isArray(nominasResponse) ? nominasResponse : [];
          setNominas(nominasArray);
          
          // Intentamos obtener la semana actual
          try {
            const semanaActualResponse = await nominaSemanalService.getSemanaActual();
            if (semanaActualResponse) {
              setSemanaActual(semanaActualResponse);
              console.log(`Semana actual inicial: ${semanaActualResponse.numero_semana} del ${semanaActualResponse.anio}`);
              
              // Filtrar y ordenar las nóminas para mostrar primero la semana actual
              organizarNominas(nominasArray, semanaActualResponse);
            }
          } catch (error) {
            console.error('Error al cargar semana actual:', error);
            setNominasFiltradas(nominasArray.sort((a, b) => a.numero_semana - b.numero_semana));
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setSnackbar({
          open: true,
          message: 'Error al cargar los datos. Por favor, intente nuevamente.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Configurar un intervalo para verificar periódicamente si cambió la semana actual
    // Esto permitirá que la aplicación reaccione automáticamente cuando cambie la semana
    const intervalId = setInterval(verificarSemanaActual, 300000); // Verificar cada 5 minutos
    
    return () => clearInterval(intervalId);
  }, [anioActual]);

  // Hook useEffect adicional para verificación inmediata al cargar y cada 5 minutos
  useEffect(() => {
    // Verificar inmediatamente al cargar o cambiar de año
    if (!loading) {
      verificarSemanaActual();
    }
  }, [loading, anioActual]);

  // Función para manejar la eliminación de un año
  const handleEliminarAnio = async () => {
    if (!anioEliminar) return;
    
    try {
      setLoading(true);
      console.log(`Iniciando eliminación del año ${anioEliminar}`);
      
      const resultado = await nominaSemanalService.eliminarAnio(anioEliminar);
      console.log(`Resultado de eliminación:`, resultado);
      
      // Actualizar la lista de años disponibles
      const aniosResponse = await nominaSemanalService.getAniosDisponibles();
      console.log('Años disponibles actualizados:', aniosResponse);
      
      if (aniosResponse && Array.isArray(aniosResponse)) {
        setAniosDisponibles(aniosResponse);
        
        // Si ya no existe el año actual, cambiar al primer año disponible
        if (!aniosResponse.includes(anioActual) && aniosResponse.length > 0) {
          console.log(`El año ${anioActual} ya no existe, cambiando al año ${aniosResponse[0]}`);
          setAnioActual(aniosResponse[0]);
        } else if (aniosResponse.length === 0) {
          // Si no quedan años, limpiar las nóminas
          console.log('No quedan años disponibles, limpiando nóminas');
          setNominas([]);
          setNominasFiltradas([]);
        } else {
          // Recargar las nóminas del año actual 
          console.log(`Recargando nóminas del año ${anioActual}`);
          const nominasResponse = await nominaSemanalService.getAll(anioActual);
          if (nominasResponse) {
            const nominasArray = Array.isArray(nominasResponse) ? nominasResponse : [];
            setNominas(nominasArray);
            
            if (semanaActual && semanaActual.anio === anioActual) {
              organizarNominas(nominasArray, semanaActual);
            } else {
              setNominasFiltradas(nominasArray.sort((a, b) => a.numero_semana - b.numero_semana));
            }
          }
        }
      }
      
      // Mostrar mensaje de éxito
      setSnackbar({
        open: true,
        message: `Año ${anioEliminar} eliminado correctamente. Se eliminaron ${resultado.eliminadas} semanas.`,
        severity: 'success'
      });
      
      // Cerrar el diálogo
      setOpenEliminarAnioDialog(false);
      setAnioEliminar(null);
    } catch (error) {
      console.error('Error al eliminar año:', error);
      setSnackbar({
        open: true,
        message: `Error al eliminar el año: ${error.message || 'Error desconocido'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir el diálogo de eliminación de año
  const handleOpenEliminarAnioDialog = (anio) => {
    setAnioEliminar(anio);
    setOpenEliminarAnioDialog(true);
  };

  // Generar semanas para un año
  const handleGenerarSemanas = async () => {
    setLoading(true);
    try {
      await nominaSemanalService.generarSemanas(anioGenerar);
      
      // Actualizar datos después de generar semanas
      const aniosResponse = await nominaSemanalService.getAniosDisponibles();
      if (aniosResponse && Array.isArray(aniosResponse)) {
        setAniosDisponibles(aniosResponse);
      }
      
      const nominasResponse = await nominaSemanalService.getAll(anioGenerar);
      if (nominasResponse) {
        const nominasArray = Array.isArray(nominasResponse) ? nominasResponse : [];
        setNominas(nominasArray);
        
        // Obtener la semana actual
        const semanaActualResponse = await nominaSemanalService.getSemanaActual();
        if (semanaActualResponse) {
          setSemanaActual(semanaActualResponse);
          organizarNominas(nominasArray, semanaActualResponse);
        } else {
          setNominasFiltradas(nominasArray);
        }
      }
      
      setAnioActual(anioGenerar);
      
      setSnackbar({
        open: true,
        message: `Semanas generadas correctamente para el año ${anioGenerar}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al generar semanas:', error);
      setSnackbar({
        open: true,
        message: 'Error al generar semanas. Por favor, intente nuevamente.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setOpenGenerarDialog(false);
    }
  };

  // Abrir diálogo para editar nómina
  const handleOpenNominaDialog = (nomina, action) => {
    setSelectedNomina(nomina);
    setDialogAction(action);
    setObservaciones(nomina.observaciones || '');
    setOpenNominaDialog(true);
  };

  // Cerrar/abrir una nómina semanal
  const handleCambiarEstadoNomina = async () => {
    if (!selectedNomina) return;
    
    setLoading(true);
    try {
      const updatedData = {
        cerrada: dialogAction === 'cerrar',
        observaciones
      };
      
      await nominaSemanalService.update(selectedNomina.id, updatedData);
      
      // Actualizar lista de nóminas
      const nominasResponse = await nominaSemanalService.getAll(anioActual);
      if (nominasResponse) {
        const nominasArray = Array.isArray(nominasResponse) ? nominasResponse : [];
        setNominas(nominasArray);
        organizarNominas(nominasArray, semanaActual);
      }
      
      setSnackbar({
        open: true,
        message: `Nómina semanal ${dialogAction === 'cerrar' ? 'cerrada' : 'reabierta'} correctamente`,
        severity: 'success'
      });
    } catch (error) {
      console.error(`Error al ${dialogAction} nómina:`, error);
      setSnackbar({
        open: true,
        message: `Error al ${dialogAction} la nómina. Por favor, intente nuevamente.`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setOpenNominaDialog(false);
    }
  };

  // Ir a detalle de nómina
  const navigateToDetail = (nominaId) => {
    navigate(`/admin/nomina-semanal/${nominaId}`);
  };

  // Determinar si una semana es la actual
  const esSemanaActual = (nomina) => {
    if (!semanaActual || !nomina) return false;
    return nomina.id === semanaActual.id;
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Manejar cambio de año personalizado
  const handleAnioCustomChange = (e) => {
    setAnioCustom(e.target.value);
  };

  // Confirmar año personalizado
  const handleConfirmAnioCustom = () => {
    if (!anioCustom) return;
    
    const anio = parseInt(anioCustom, 10);
    if (isNaN(anio) || anio < 1980 || anio > 2100) {
      setSnackbar({
        open: true,
        message: 'Por favor, ingrese un año válido entre 1980 y 2100',
        severity: 'error'
      });
      return;
    }
    
    setAnioGenerar(anio);
  };

  // Cargar nóminas al seleccionar un año
  const handleAnioChange = (e) => {
    const selectedAnio = e.target.value;
    setAnioActual(selectedAnio);
  };

  return (
    <Container maxWidth="xl">
      <LoadingBackdrop open={loading} />
      
      {/* Título y botones principales */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4,
          mt: 3,
          bgcolor: 'background.default',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box 
          display="flex" 
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={2}
        >
          <Box display="flex" alignItems="center">
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600, 
                color: '#4338CA',
                display: 'flex',
                alignItems: 'center',
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}
            >
              <CalendarMonth sx={{ mr: 1, fontSize: { xs: '1.8rem', sm: '2.2rem' } }} />
              Nóminas Semanales
            </Typography>
          </Box>
          
          <Button 
            variant="contained" 
            startIcon={<PostAdd />}
            onClick={() => setOpenGenerarDialog(true)}
            sx={{ 
              fontWeight: 500,
              boxShadow: 'none',
              bgcolor: '#4338CA',
              '&:hover': {
                bgcolor: '#3730A3',
                boxShadow: '0 2px 4px rgba(67, 56, 202, 0.2)'
              },
              px: 3,
              py: 1,
              borderRadius: 1.5,
              textTransform: 'none'
            }}
          >
            GENERAR SEMANAS
          </Button>
        </Box>
      </Paper>

      {/* Sección de Semana Actual */}
      {semanaActual && (
        <Paper 
          elevation={0}
          onClick={() => navigateToDetail(semanaActual.id)}
          sx={{ 
            mb: 4,
            bgcolor: '#EEF2FF',
            border: '2px solid',
            borderColor: '#4338CA',
            borderRadius: 2,
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(67, 56, 202, 0.12)',
              bgcolor: '#F5F7FF',
              '& .MuiButton-root': {
                bgcolor: '#3730A3',
              }
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'rgba(67, 56, 202, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Today sx={{ color: '#4338CA', fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography 
                        variant="h5" 
                        component="h2" 
                        sx={{ 
                          fontWeight: 600,
                          color: '#4338CA',
                          fontSize: { xs: '1.25rem', sm: '1.5rem' }
                        }}
                      >
                        Semana Actual
                      </Typography>
                      <Chip 
                        label="En curso" 
                        size="small"
                        sx={{ 
                          bgcolor: 'rgba(67, 56, 202, 0.1)',
                          color: '#4338CA',
                          fontWeight: 500,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                    <Typography 
                      variant="subtitle1" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      Semana {semanaActual.numero_semana} del {semanaActual.anio} • {formatDate(semanaActual.fecha_inicio)} - {formatDate(semanaActual.fecha_fin)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<Visibility />}
                    sx={{ 
                      fontWeight: 500,
                      boxShadow: 'none',
                      bgcolor: '#4338CA',
                      '&:hover': {
                        bgcolor: '#3730A3',
                      },
                      px: 3,
                      py: 1,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      pointerEvents: 'none'
                    }}
                  >
                    Ver Detalle
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {/* Selector de Año */}
      <Paper
        elevation={0}
        sx={{ 
          p: 3,
          mb: 4,
          bgcolor: 'white',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                mb: { xs: 1, md: 0 }
              }}
            >
              Nómina Semanal
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <FormControl fullWidth>
                <InputLabel id="anio-select-label">Año</InputLabel>
                <Select
                  labelId="anio-select-label"
                  value={anioActual}
                  onChange={handleAnioChange}
                  label="Año"
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4338CA'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4338CA'
                    }
                  }}
                >
                  {aniosDisponibles.map((anio) => (
                    <MenuItem key={anio} value={anio}>{anio}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => handleOpenEliminarAnioDialog(anioActual)}
                sx={{ 
                  minWidth: { xs: '100%', sm: 'auto' },
                  borderColor: '#DC2626',
                  color: '#DC2626',
                  '&:hover': {
                    bgcolor: 'rgba(220, 38, 38, 0.04)',
                    borderColor: '#DC2626'
                  }
                }}
              >
                Eliminar año {anioActual}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Vista móvil usando Cards en lugar de tabla */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {nominasFiltradas.map((nomina) => (
          <Card 
            key={nomina.id} 
            sx={{ 
              mb: 2,
              border: esSemanaActual(nomina) ? '2px solid #6366f1' : 'none'
            }}
          >
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      Semana {nomina.numero_semana}
                    </Typography>
                    {esSemanaActual(nomina) && (
                      <Chip 
                        label="Actual" 
                        color="primary" 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(nomina.fecha_inicio)} - {formatDate(nomina.fecha_fin)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Tooltip title="Ver detalles">
                      <IconButton 
                        size="small"
                        onClick={() => navigateToDetail(nomina.id)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={nomina.bloqueada ? 'Desbloquear' : 'Bloquear'}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenNominaDialog(nomina, nomina.bloqueada ? 'desbloquear' : 'bloquear')}
                        color={nomina.bloqueada ? 'error' : 'success'}
                      >
                        {nomina.bloqueada ? <Lock /> : <LockOpen />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Vista desktop mantiene la tabla original */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#EEF2FF' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Semana</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Período</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Observaciones</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nominasFiltradas.length > 0 ? (
                nominasFiltradas.map((nomina) => (
                  <TableRow 
                    key={nomina.id}
                    sx={{ 
                      '&:hover': { backgroundColor: 'action.hover' },
                      ...( esSemanaActual(nomina) ? {
                        backgroundColor: '#EEF2FF',
                        '& td': { fontWeight: 'bold' },
                        '&:hover': { backgroundColor: '#EEF2FF' }
                      } : {})
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {esSemanaActual(nomina) && (
                          <Box 
                            sx={{ 
                              width: 5, 
                              height: 42, 
                              backgroundColor: '#4338CA',
                              borderRadius: 2,
                              mr: 1.5
                            }} 
                          />
                        )}
                        <Typography 
                          fontWeight={esSemanaActual(nomina) ? 'bold' : 'regular'}
                        >
                          Semana {nomina.numero_semana}
                          {esSemanaActual(nomina) && (
                            <Chip 
                              size="small" 
                              label="Actual" 
                              sx={{ 
                                ml: 1, 
                                height: 20,
                                bgcolor: '#4338CA',
                                color: 'white'
                              }} 
                            />
                          )}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(nomina.fecha_inicio)} - {formatDate(nomina.fecha_fin)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={nomina.cerrada ? "Cerrada" : "Abierta"} 
                        color={nomina.cerrada ? "error" : "success"}
                        size="small"
                        variant={esSemanaActual(nomina) ? "filled" : "outlined"}
                        icon={nomina.cerrada ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ 
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {nomina.observaciones || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        {!nomina.cerrada ? (
                          <Tooltip title="Cerrar nómina">
                            <IconButton 
                              color="error"
                              onClick={() => handleOpenNominaDialog(nomina, 'cerrar')}
                              size="small"
                            >
                              <Lock fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Reabrir nómina">
                            <IconButton 
                              color="success"
                              onClick={() => handleOpenNominaDialog(nomina, 'reabrir')}
                              size="small"
                            >
                              <LockOpen fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Ir a detalle">
                          <IconButton 
                            sx={{ 
                              color: '#4338CA',
                              '&:hover': {
                                bgcolor: '#EEF2FF'
                              }
                            }}
                            onClick={() => navigateToDetail(nomina.id)}
                            size="small"
                          >
                            <ArrowForward fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    {aniosDisponibles.length > 0 ? (
                      <Typography color="text.secondary">
                        No hay nóminas disponibles para el año {anioActual}
                      </Typography>
                    ) : (
                      <Typography color="text.secondary">
                        No hay nóminas generadas. Utilice el botón "Generar Semanas" para crear las semanas de un año.
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      {/* Diálogo para generar semanas */}
      <Dialog
        open={openGenerarDialog}
        onClose={() => setOpenGenerarDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.default'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, color: '#4338CA' }}>
          Generar Semanas de un Año
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Esta acción generará todas las semanas (52 o 53) para el año seleccionado. Solo debe realizarse una vez por año.
          </Typography>

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, color: '#4338CA' }}>
            Seleccione un año predefinido:
          </Typography>
          <Select
            value={anioGenerar}
            onChange={(e) => setAnioGenerar(e.target.value)}
            fullWidth
            sx={{ mb: 3 }}
          >
            {[...Array(21)].map((_, i) => {
              const year = new Date().getFullYear() - 5 + i;
              return (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              );
            })}
          </Select>

          <Typography variant="subtitle1" sx={{ mb: 1, color: '#4338CA' }}>
            O ingrese un año personalizado:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              placeholder="Ej: 2030"
              value={anioCustom}
              onChange={handleAnioCustomChange}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#4338CA'
                  }
                }
              }}
            />
            <Button 
              variant="contained" 
              onClick={handleConfirmAnioCustom}
              sx={{ 
                bgcolor: '#4338CA',
                '&:hover': { bgcolor: '#3730A3' }
              }}
            >
              USAR
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Puede generar semanas para cualquier año entre 1980 y 2100
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={() => setOpenGenerarDialog(false)}
            color="inherit"
          >
            CANCELAR
          </Button>
          <Button 
            onClick={handleGenerarSemanas}
            variant="contained"
            sx={{ 
              bgcolor: '#4338CA',
              '&:hover': { bgcolor: '#3730A3' }
            }}
          >
            GENERAR SEMANAS
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para cerrar/reabrir nómina */}
      <Dialog
        open={openNominaDialog}
        onClose={() => setOpenNominaDialog(false)}
        aria-labelledby="nomina-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="nomina-dialog-title" sx={{ pb: 1 }}>
          {dialogAction === 'cerrar' ? 'Cerrar Nómina Semanal' : 'Reabrir Nómina Semanal'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {dialogAction === 'cerrar' 
              ? 'Al cerrar la nómina, no se podrán realizar más modificaciones a menos que se reabra posteriormente.'
              : 'Al reabrir la nómina, se permitirán modificaciones nuevamente.'}
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            id="observaciones"
            name="observaciones"
            label="Observaciones"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenNominaDialog(false)} 
            color="inherit"
            sx={{ fontWeight: 500 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCambiarEstadoNomina} 
            variant="contained" 
            color={dialogAction === 'cerrar' ? 'error' : 'success'}
            startIcon={dialogAction === 'cerrar' ? <Lock /> : <LockOpen />}
            sx={{ fontWeight: 500 }}
          >
            {dialogAction === 'cerrar' ? 'Cerrar Nómina' : 'Reabrir Nómina'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Diálogo para eliminar año */}
      <Dialog
        open={openEliminarAnioDialog}
        onClose={() => setOpenEliminarAnioDialog(false)}
        aria-labelledby="eliminar-anio-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="eliminar-anio-dialog-title" sx={{ pb: 1, color: 'error.main' }}>
          Eliminar año {anioEliminar}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Esta acción eliminará <strong>permanentemente</strong> todas las semanas del año {anioEliminar} y todos los datos asociados a ellas. Esta acción no se puede deshacer.
          </DialogContentText>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ¡Atención! Se eliminarán también todos los pagos registrados en las nóminas de este año.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenEliminarAnioDialog(false)} 
            color="inherit" 
            sx={{ fontWeight: 500 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEliminarAnio} 
            variant="contained" 
            color="error"
            startIcon={<Delete />}
            sx={{ fontWeight: 500 }}
          >
            Eliminar Año
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NominasSemanalPage; 