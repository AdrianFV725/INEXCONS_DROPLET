import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import { 
  CalendarMonth, 
  Add, 
  Edit, 
  Delete, 
  Lock, 
  LockOpen, 
  ArrowBack,
  Check,
  Clear,
  Save,
  Calculate,
  Person,
  AttachMoney
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';

import nominaSemanalService from '../../services/nominaSemanalService';
import LoadingBackdrop from '../../components/LoadingBackdrop';
import PagoNominaForm from '../../components/PagoNominaForm';

const NominaSemanalDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nomina, setNomina] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [openPagoDialog, setOpenPagoDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEstadoDialog, setOpenEstadoDialog] = useState(false);
  const [selectedPago, setSelectedPago] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observacionesNomina, setObservacionesNomina] = useState('');
  const [openObservacionesDialog, setOpenObservacionesDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // create, edit
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [openCerrarDialog, setOpenCerrarDialog] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await nominaSemanalService.getById(id);
        setNomina(data); // Ahora data es directamente la nómina
        setPagos(data.pagos || []); // Los pagos vienen incluidos en la respuesta
        setObservacionesNomina(data.observaciones || '');
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
  }, [id]);

  // Abrir diálogo para crear/editar pago
  const handleOpenPagoDialog = (pago = null) => {
    setSelectedPago(pago);
    setDialogMode(pago ? 'edit' : 'create');
    setOpenPagoDialog(true);
  };

  // Abrir diálogo para eliminar pago
  const handleOpenDeleteDialog = (pago) => {
    setSelectedPago(pago);
    setOpenDeleteDialog(true);
  };
  
  // Abrir diálogo para cambiar estado de pago
  const handleOpenEstadoDialog = (pago) => {
    setSelectedPago(pago);
    setNuevoEstado(pago.estado === 'pendiente' ? 'pagado' : 'pendiente');
    setOpenEstadoDialog(true);
  };

  // Guardar pago (crear o editar)
  const handleSavePago = async (pagoData) => {
    setLoading(true);
    try {
      if (dialogMode === 'create') {
        await nominaSemanalService.createPago(id, pagoData);
        setSnackbar({
          open: true,
          message: 'Pago creado correctamente',
          severity: 'success'
        });
      } else {
        await nominaSemanalService.updatePago(id, selectedPago.id, pagoData);
        setSnackbar({
          open: true,
          message: 'Pago actualizado correctamente',
          severity: 'success'
        });
      }
      
      // Recargar datos
      const data = await nominaSemanalService.getById(id);
      setNomina(data);
      setPagos(data.pagos || []);
    } catch (error) {
      console.error('Error al guardar pago:', error);
      let errorMessage = 'Error al guardar el pago.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setOpenPagoDialog(false);
    }
  };

  // Eliminar pago
  const handleDeletePago = async () => {
    if (!selectedPago) return;
    
    setLoading(true);
    try {
      await nominaSemanalService.deletePago(id, selectedPago.id);
      
      // Recargar datos
      const data = await nominaSemanalService.getById(id);
      setNomina(data);
      setPagos(data.pagos || []);
      
      setSnackbar({
        open: true,
        message: 'Pago eliminado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      let errorMessage = 'Error al eliminar el pago.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      setSelectedPago(null);
    }
  };

  // Cambiar estado de pago (pendiente/pagado)
  const handleCambiarEstadoPago = async () => {
    if (!selectedPago) return;
    
    setLoading(true);
    try {
      await nominaSemanalService.cambiarEstadoPago(id, selectedPago.id, nuevoEstado);
      
      // Recargar datos
      const data = await nominaSemanalService.getById(id);
      setNomina(data);
      setPagos(data.pagos || []);
      
      setSnackbar({
        open: true,
        message: `Estado del pago cambiado a "${nuevoEstado}"`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al cambiar estado de pago:', error);
      let errorMessage = 'Error al cambiar el estado del pago.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setOpenEstadoDialog(false);
    }
  };

  // Guardar observaciones de nómina
  const handleSaveObservaciones = async () => {
    setLoading(true);
    try {
      await nominaSemanalService.update(id, { observaciones: observacionesNomina });
      
      // Recargar datos
      const data = await nominaSemanalService.getById(id);
      setNomina(data);
      
      setSnackbar({
        open: true,
        message: 'Observaciones guardadas correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al guardar observaciones:', error);
      setSnackbar({
        open: true,
        message: 'Error al guardar observaciones',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setOpenObservacionesDialog(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para manejar el cierre/apertura de la nómina
  const handleToggleNominaCerrada = async () => {
    setLoading(true);
    try {
      await nominaSemanalService.update(id, { cerrada: !nomina.cerrada });
      
      // Recargar datos
      const data = await nominaSemanalService.getById(id);
      setNomina(data);
      setPagos(data.pagos || []);
      
      setSnackbar({
        open: true,
        message: `Nómina ${nomina.cerrada ? 'reabierta' : 'cerrada'} correctamente`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al cambiar estado de la nómina:', error);
      setSnackbar({
        open: true,
        message: 'Error al cambiar el estado de la nómina',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setOpenCerrarDialog(false);
    }
  };

  // Si aún está cargando o no hay datos de nómina, mostrar un indicador de carga
  if (loading || !nomina) {
    return <LoadingBackdrop open={true} />;
  }

  return (
    <Container maxWidth="xl">
      <LoadingBackdrop open={loading} />
      
      {/* Título y botones principales */}
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={4}
        mt={3}
      >
        <Box display="flex" alignItems="center" width="100%">
          <IconButton 
            color="primary" 
            onClick={() => navigate('/admin/nomina-semanal')}
            sx={{ 
              mr: { xs: 1, sm: 2 },
              bgcolor: '#EEF2FF', 
              color: '#4338CA',
              flexShrink: 0
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {/* Título para móvil */}
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <Typography 
                variant="h6" 
                component="h1" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#4338CA',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <CalendarMonth sx={{ mr: 1, fontSize: '1.25rem' }} />
                Nómina Semanal
              </Typography>
              {nomina && (
                <Typography 
                  variant="subtitle1" 
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Semana {nomina.numero_semana} del {nomina.anio}
                </Typography>
              )}
            </Box>
            
            {/* Título para desktop */}
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600, 
                color: '#4338CA',
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center'
              }}
            >
              <CalendarMonth sx={{ mr: 1 }} />
              Detalle Nómina Semanal
            </Typography>
          </Box>
        </Box>
        
        {nomina && (
          <Box 
            display="flex" 
            gap={2} 
            flexWrap="wrap" 
            mt={{ xs: 2, sm: 0 }}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'flex-start', sm: 'flex-end' }
            }}
          >
            <Button 
              variant="contained" 
              startIcon={nomina.cerrada ? <LockOpen /> : <Lock />}
              onClick={() => setOpenCerrarDialog(true)}
              sx={{ 
                fontWeight: 500,
                boxShadow: 2,
                bgcolor: nomina.cerrada ? '#4338CA' : '#DC2626',
                '&:hover': {
                  boxShadow: 3,
                  bgcolor: nomina.cerrada ? '#3730A3' : '#B91C1C'
                }
              }}
            >
              {nomina.cerrada ? 'ABRIR' : 'CERRAR'}
            </Button>
            {!nomina.cerrada && (
              <Button 
                variant="contained" 
                startIcon={<Add />}
                onClick={() => handleOpenPagoDialog()}
                disabled={!nomina}
                sx={{ 
                  fontWeight: 500,
                  boxShadow: 2,
                  bgcolor: '#4338CA',
                  '&:hover': {
                    boxShadow: 3,
                    bgcolor: '#3730A3'
                  }
                }}
              >
                Nuevo Pago
              </Button>
            )}
          </Box>
        )}
      </Box>
      
      {/* Información de la nómina */}
      {nomina && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={8}>
            <Card 
              sx={{ 
                height: '100%', 
                boxShadow: 2, 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={2}>
                  <Typography variant="h5" component="h2">
                    Semana {nomina.numero_semana} del {nomina.anio}
                  </Typography>
                  <Chip 
                    label={nomina.cerrada ? "Cerrada" : "Abierta"} 
                    color={nomina.cerrada ? "error" : "success"}
                    variant="outlined"
                    icon={nomina.cerrada ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />}
                    onClick={() => setOpenCerrarDialog(true)}
                    sx={{ 
                      fontWeight: 500,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: nomina.cerrada ? 'error.lighter' : 'success.lighter'
                      }
                    }}
                  />
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Período
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatDate(nomina.fecha_inicio)} - {formatDate(nomina.fecha_fin)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Última modificación
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {nomina.updated_at ? formatDate(nomina.updated_at) : 'No disponible'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} mt={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Observaciones
                    </Typography>
                    <Box 
                      display="flex" 
                      justifyContent="space-between" 
                      alignItems="flex-start"
                      mt={1}
                    >
                      <Typography variant="body1">
                        {nomina.observaciones || 'Sin observaciones'}
                      </Typography>
                      {!nomina.cerrada && (
                        <Button 
                          size="small" 
                          startIcon={<Edit />} 
                          onClick={() => setOpenObservacionesDialog(true)}
                          sx={{ 
                            ml: 2,
                            color: '#4338CA',
                            '&:hover': {
                              bgcolor: '#EEF2FF'
                            }
                          }}
                        >
                          Editar
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                boxShadow: 2, 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'primary.lighter'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                  <Calculate sx={{ mr: 1, verticalAlign: 'top' }} />
                  Resumen Financiero
                </Typography>
                
                <Divider sx={{ mb: 3 }} />
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Pagado
                  </Typography>
                  <Typography variant="h5" color="success.main" fontWeight={600}>
                    ${parseFloat(nomina.total_pagado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Pendiente
                  </Typography>
                  <Typography variant="h5" color="warning.main" fontWeight={600}>
                    ${parseFloat(nomina.total_pendiente || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Pagos Registrados
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {pagos.length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Tabla de pagos */}
      <Box mb={3}>
        <Typography variant="h5" component="h2" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <AttachMoney sx={{ mr: 1 }} /> 
          Pagos Registrados
        </Typography>
        
        {/* Vista móvil: Tarjetas */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {pagos.length > 0 ? (
            <Stack spacing={2}>
              {pagos.map((pago) => (
                <Card
                  key={pago.id}
                  sx={{
                    borderRadius: 2,
                    boxShadow: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {/* Encabezado con estado y acciones */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Chip 
                        label={pago.estado === 'pagado' ? 'Pagado' : 'Pendiente'} 
                        color={pago.estado === 'pagado' ? 'success' : 'warning'}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                      <Box>
                        {!nomina?.cerrada && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenPagoDialog(pago)}
                              sx={{ color: 'primary.main' }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteDialog(pago)}
                              sx={{ color: 'error.main' }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </Box>

                    {/* Información del receptor */}
                    <Box display="flex" alignItems="center" mb={1.5}>
                      <Person sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                      <Box>
                        <Typography variant="subtitle2" fontWeight={500}>
                          {pago.nombre_receptor}
                        </Typography>
                        {pago.trabajador_id && (
                          <Typography variant="caption" color="text.secondary">
                            ID: {pago.trabajador_id}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Detalles del pago */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Monto
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight={500}
                          color={pago.estado === 'pagado' ? 'success.main' : 'warning.main'}
                        >
                          ${parseFloat(pago.monto).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Fecha
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(pago.fecha_pago)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Concepto
                        </Typography>
                        <Typography variant="body2">
                          {pago.concepto}
                        </Typography>
                        {pago.observaciones && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                              display: 'block',
                              mt: 0.5
                            }}
                          >
                            {pago.observaciones}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No hay pagos registrados para esta nómina.
                </Typography>
                {!nomina?.cerrada && (
                  <Button 
                    variant="outlined" 
                    startIcon={<Add />} 
                    onClick={() => handleOpenPagoDialog()}
                    sx={{ 
                      mt: 2,
                      color: '#4338CA',
                      borderColor: '#4338CA',
                      '&:hover': {
                        bgcolor: '#EEF2FF',
                        borderColor: '#4338CA'
                      }
                    }}
                  >
                    Agregar Pago
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Vista desktop: Tabla */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Paper
            elevation={3}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <TableContainer sx={{ minHeight: 200 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.lighter' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Receptor</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Concepto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Monto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagos.length > 0 ? (
                    pagos.map((pago) => (
                      <TableRow 
                        key={pago.id}
                        sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Person sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {pago.nombre_receptor}
                              </Typography>
                              {pago.trabajador_id && (
                                <Typography variant="caption" color="text.secondary">
                                  ID: {pago.trabajador_id}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {pago.concepto}
                          </Typography>
                          {pago.observaciones && (
                            <Tooltip title={pago.observaciones}>
                              <Typography 
                                variant="caption" 
                                color="text.secondary" 
                                sx={{ 
                                  display: 'block',
                                  maxWidth: 200,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {pago.observaciones}
                              </Typography>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            fontWeight={500}
                            color={pago.estado === 'pagado' ? 'success.main' : 'warning.main'}
                          >
                            ${parseFloat(pago.monto).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(pago.fecha_pago)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={pago.estado === 'pagado' ? 'Pagado' : 'Pendiente'} 
                            color={pago.estado === 'pagado' ? 'success' : 'warning'}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {!nomina?.cerrada && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenPagoDialog(pago)}
                                sx={{ color: 'primary.main' }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDeleteDialog(pago)}
                                sx={{ color: 'error.main' }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No hay pagos registrados para esta nómina.
                        </Typography>
                        {!nomina?.cerrada && (
                          <Button 
                            variant="outlined" 
                            startIcon={<Add />} 
                            onClick={() => handleOpenPagoDialog()}
                            sx={{ 
                              mt: 2,
                              color: '#4338CA',
                              borderColor: '#4338CA',
                              '&:hover': {
                                bgcolor: '#EEF2FF',
                                borderColor: '#4338CA'
                              }
                            }}
                          >
                            Agregar Pago
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>

      {/* Diálogo para editar observaciones */}
      <Dialog
        open={openObservacionesDialog}
        onClose={() => setOpenObservacionesDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Editar Observaciones
        </DialogTitle>
        <DialogContent>
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
            value={observacionesNomina}
            onChange={(e) => setObservacionesNomina(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenObservacionesDialog(false)} 
            color="inherit"
            sx={{ fontWeight: 500 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveObservaciones} 
            variant="contained" 
            startIcon={<Save />}
            sx={{ 
              fontWeight: 500,
              bgcolor: '#4338CA',
              '&:hover': {
                bgcolor: '#3730A3'
              }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para crear/editar pago */}
      <Dialog
        open={openPagoDialog}
        onClose={() => setOpenPagoDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          {dialogMode === 'create' ? 'Nuevo Pago' : 'Editar Pago'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <PagoNominaForm
            initialData={selectedPago}
            onSubmit={handleSavePago}
            onCancel={() => setOpenPagoDialog(false)}
            isEdit={dialogMode === 'edit'}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo para eliminar pago */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Eliminar Pago
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.
          </DialogContentText>
          {selectedPago && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Detalles del pago:
              </Typography>
              <Typography variant="body2">
                <strong>Receptor:</strong> {selectedPago.nombre_receptor}
              </Typography>
              <Typography variant="body2">
                <strong>Monto:</strong> ${parseFloat(selectedPago.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2">
                <strong>Fecha:</strong> {formatDate(selectedPago.fecha_pago)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)}
            color="inherit"
            sx={{ fontWeight: 500 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeletePago}
            variant="contained"
            color="error"
            startIcon={<Delete />}
            sx={{ fontWeight: 500 }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para cambiar estado de pago */}
      <Dialog
        open={openEstadoDialog}
        onClose={() => setOpenEstadoDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Cambiar Estado del Pago
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            ¿Desea cambiar el estado del pago a "{nuevoEstado === 'pagado' ? 'Pagado' : 'Pendiente'}"?
          </DialogContentText>
          {selectedPago && (
            <Box mt={2} p={2} bgcolor="action.hover" borderRadius={1}>
              <Typography variant="subtitle2" gutterBottom>
                Receptor: {selectedPago.nombre_receptor}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Monto: ${parseFloat(selectedPago.monto).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="subtitle2">
                Estado actual: {selectedPago.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenEstadoDialog(false)} 
            color="inherit"
            sx={{ fontWeight: 500 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCambiarEstadoPago} 
            variant="contained" 
            color={nuevoEstado === 'pagado' ? 'success' : 'warning'}
            startIcon={nuevoEstado === 'pagado' ? <Check /> : <Clear />}
            sx={{ fontWeight: 500 }}
          >
            Marcar como {nuevoEstado === 'pagado' ? 'Pagado' : 'Pendiente'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para confirmar cierre/apertura de nómina */}
      <Dialog
        open={openCerrarDialog}
        onClose={() => setOpenCerrarDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          {nomina?.cerrada ? 'Abrir Nómina' : 'Cerrar Nómina'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {nomina?.cerrada ? 
              '¿Está seguro de abrir esta nómina? Esto permitirá realizar modificaciones nuevamente.' :
              '¿Está seguro de cerrar esta nómina? Esto impedirá realizar más modificaciones.'
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenCerrarDialog(false)} 
            color="inherit"
            sx={{ fontWeight: 500 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleToggleNominaCerrada} 
            variant="contained" 
            startIcon={nomina?.cerrada ? <LockOpen /> : <Lock />}
            sx={{ 
              fontWeight: 500,
              bgcolor: nomina?.cerrada ? '#4338CA' : '#DC2626',
              '&:hover': {
                bgcolor: nomina?.cerrada ? '#3730A3' : '#B91C1C'
              }
            }}
          >
            {nomina?.cerrada ? 'Abrir' : 'Cerrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NominaSemanalDetallePage; 