import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Grid,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Paper,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment
} from '@mui/material';
import {
  Folder as FolderIcon,
  CreateNewFolder,
  UploadFile,
  Description,
  Image,
  PictureAsPdf,
  TableChart,
  Archive,
  Download,
  Delete,
  NavigateNext,
  ViewModule,
  ViewList,
  Home,
  Edit,
  Article,
  TextSnippet,
  AudioFile,
  VideoFile,
  Search,
  Clear,
  Add
} from '@mui/icons-material';
import fileManagerService from '../../services/fileManagerService';
import LoadingBackdrop from '../../components/LoadingBackdrop';
import { CircularProgress } from '@mui/material';

const FileManagerPage = () => {
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [openNewFolderDialog, setOpenNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [openEditFolderDialog, setOpenEditFolderDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderDescription, setEditFolderDescription] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isFolder, setIsFolder] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({ folders: [], files: [] });
  const searchTimeoutRef = useRef(null);

  // Cargar contenido de la carpeta
  const loadFolderContents = async (folderId = null) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Cargando contenido de carpeta:', folderId);
      const data = await fileManagerService.getFolderContents(folderId);
      console.log('Datos recibidos:', data);
      
      if (data && data.success) {
        setCurrentFolder(data.currentFolder || null);
        setFolders(data.folders || []);
        setFiles(data.files || []);
        setBreadcrumbs(data.breadcrumbs || []);
      } else {
        console.error('Error en la respuesta:', data);
        setError('Error al cargar el contenido de la carpeta');
        setSnackbar({
          open: true,
          message: 'Error al cargar el contenido de la carpeta',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error al cargar contenido:', error);
      setError('Error al cargar el contenido de la carpeta');
      setSnackbar({
        open: true,
        message: 'Error al cargar el contenido de la carpeta',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Navegar a una carpeta
  const navigateToFolder = (folderId) => {
    console.log('Navegando a carpeta:', folderId);
    // Limpiar la búsqueda al navegar
    setSearchQuery('');
    setSearchResults({ folders: [], files: [] });
    loadFolderContents(folderId);
  };

  // Cargar contenido inicial
  useEffect(() => {
    console.log('Cargando contenido inicial');
    loadFolderContents();
  }, []);

  // Crear nueva carpeta
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setLoading(true);
    try {
      await fileManagerService.createFolder({
        name: newFolderName.trim(),
        description: newFolderDescription.trim(),
        parent_id: currentFolder?.id
      });

      setSnackbar({
        open: true,
        message: 'Carpeta creada correctamente',
        severity: 'success'
      });

      // Recargar contenido
      loadFolderContents(currentFolder?.id);
    } catch (error) {
      console.error('Error al crear carpeta:', error);
      setSnackbar({
        open: true,
        message: 'Error al crear la carpeta',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setOpenNewFolderDialog(false);
      setNewFolderName('');
      setNewFolderDescription('');
    }
  };

  // Subir archivo
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setSnackbar({
        open: true,
        message: 'Por favor, selecciona un archivo',
        severity: 'error'
      });
      return;
    }

    // Validar tamaño del archivo (100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB en bytes
    if (file.size > maxSize) {
      setSnackbar({
        open: true,
        message: 'El archivo excede el tamaño máximo permitido (100MB)',
        severity: 'error'
      });
      event.target.value = '';
      return;
    }

    // Mostrar información del archivo que se intenta subir
    console.log('Intentando subir archivo:', {
      nombre: file.name,
      tipo: file.type,
      tamaño: file.size,
      última_modificación: file.lastModified
    });

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Asegurarse de que el archivo se agrega correctamente
      formData.append('file', file, file.name);
      
      // Solo agregar folder_id si existe
      if (currentFolder?.id) {
        formData.append('folder_id', currentFolder.id);
      }

      // Verificar el contenido del FormData antes de enviarlo
      console.log('Contenido del FormData antes de enviar:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[0] === 'file' ? pair[1].name : pair[1]));
      }

      const response = await fileManagerService.uploadFile(formData);
      console.log('Respuesta del servidor:', response);

      setSnackbar({
        open: true,
        message: 'Archivo subido correctamente',
        severity: 'success'
      });

      // Recargar contenido
      loadFolderContents(currentFolder?.id);
    } catch (error) {
      console.error('Error detallado al subir archivo:', error);
      
      let errorMessage = 'Error al subir el archivo';
      
      // Intentar obtener mensaje de error más específico
      if (error.response) {
        console.error('Respuesta del error:', error.response.data);
        console.error('Estado del error:', error.response.status);
        
        if (error.response.data) {
          errorMessage = error.response.data.error || 
                        error.response.data.message || 
                        'Error al subir el archivo';
          
          if (error.response.data.detalles) {
            console.error('Detalles del error:', error.response.data.detalles);
            errorMessage += `: ${error.response.data.detalles}`;
          }
        }
        
        // Manejar errores específicos
        if (error.response.status === 413) {
          errorMessage = 'El archivo es demasiado grande (máximo 100MB)';
        } else if (error.response.status === 422) {
          errorMessage = error.response.data.error || 'El archivo no cumple con los requisitos';
        } else if (error.response.status === 401) {
          errorMessage = 'No tienes permisos para subir archivos';
        } else if (error.response.status === 500) {
          errorMessage = error.response.data.error || 'Error del servidor al procesar el archivo';
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  // Descargar archivo
  const handleDownloadFile = async (file) => {
    try {
      const blob = await fileManagerService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      setSnackbar({
        open: true,
        message: 'Error al descargar el archivo',
        severity: 'error'
      });
    }
  };

  // Eliminar archivo o carpeta
  const handleDelete = (item, folderFlag = false) => {
    setItemToDelete(item);
    setIsFolder(folderFlag);
    setOpenDeleteDialog(true);
  };

  // Obtener icono según tipo de archivo
  const getFileIcon = (file) => {
    switch (file.type) {
      case 'image':
        return <Image sx={{ color: '#10B981' }} />; // Verde para imágenes
      case 'pdf':
        return <PictureAsPdf sx={{ color: '#EF4444' }} />; // Rojo para PDFs
      case 'office':
        return <Article sx={{ color: '#3B82F6' }} />; // Azul para documentos de Office
      case 'excel':
        return <TableChart sx={{ color: '#059669' }} />; // Verde oscuro para Excel
      case 'compressed':
        return <Archive sx={{ color: '#8B5CF6' }} />; // Púrpura para archivos comprimidos
      case 'text':
        return <TextSnippet sx={{ color: '#6B7280' }} />; // Gris para texto
      case 'audio':
        return <AudioFile sx={{ color: '#F59E0B' }} />; // Ámbar para audio
      case 'video':
        return <VideoFile sx={{ color: '#EC4899' }} />; // Rosa para video
      default:
        return <Description sx={{ color: '#6B7280' }} />; // Gris para otros tipos
    }
  };

  // Abrir diálogo de edición
  const handleOpenEditDialog = (folder, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSelectedFolder(folder);
    setEditFolderName(folder.name);
    setEditFolderDescription(folder.description || '');
    setOpenEditFolderDialog(true);
  };

  // Editar carpeta
  const handleEditFolder = async () => {
    if (!editFolderName.trim() || !selectedFolder) return;

    setLoading(true);
    try {
      await fileManagerService.updateFolder(selectedFolder.id, {
        name: editFolderName.trim(),
        description: editFolderDescription.trim()
      });

      setSnackbar({
        open: true,
        message: 'Carpeta actualizada correctamente',
        severity: 'success'
      });

      // Recargar contenido
      await loadFolderContents(currentFolder?.id);
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error al actualizar carpeta:', error);
      setSnackbar({
        open: true,
        message: 'Error al actualizar la carpeta',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cerrar diálogo de edición
  const handleCloseEditDialog = () => {
    setOpenEditFolderDialog(false);
    setSelectedFolder(null);
    setEditFolderName('');
    setEditFolderDescription('');
  };

  // Confirmar eliminación
  const confirmDelete = async () => {
    setLoading(true);
    try {
      if (isFolder) {
        await fileManagerService.deleteFolder(itemToDelete.id);
      } else {
        await fileManagerService.deleteFile(itemToDelete.id);
      }

      setSnackbar({
        open: true,
        message: `${isFolder ? 'Carpeta' : 'Archivo'} eliminado correctamente`,
        severity: 'success'
      });

      // Recargar contenido
      loadFolderContents(currentFolder?.id);
    } catch (error) {
      console.error('Error al eliminar:', error);
      setSnackbar({
        open: true,
        message: `Error al eliminar ${isFolder ? 'la carpeta' : 'el archivo'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  // Manejador de búsqueda en tiempo real
  const handleSearch = async (query) => {
    setSearchQuery(query);
    setIsSearching(true);

    // Limpiar el timeout anterior si existe
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Si la búsqueda está vacía, mostrar el contenido normal
    if (!query.trim()) {
      setSearchResults({ folders: [], files: [] });
      setIsSearching(false);
      return;
    }

    // Establecer un nuevo timeout para evitar múltiples llamadas
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await fileManagerService.searchFiles(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Error al buscar archivos:', error);
        setSnackbar({
          open: true,
          message: 'Error al realizar la búsqueda',
          severity: 'error'
        });
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms de debounce
  };

  return (
    <Container maxWidth="xl">
      <LoadingBackdrop open={loading} />

      {/* Encabezado y acciones principales */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          mt: 3, 
          bgcolor: 'background.default',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        {/* Encabezado Principal */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3
        }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              color: '#4338CA',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            <FolderIcon sx={{ mr: 1, fontSize: { xs: '1.8rem', sm: '2.2rem' } }} />
            Gestor de Archivos
          </Typography>

          {/* Botones de Vista */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newValue) => newValue && setViewMode(newValue)}
            size="small"
            sx={{
              display: { xs: 'none', sm: 'flex' },
              bgcolor: 'background.paper',
              '& .MuiToggleButton-root': {
                border: '1px solid',
                borderColor: 'divider',
                px: 2,
              },
              '& .MuiToggleButton-root.Mui-selected': {
                bgcolor: '#EEF2FF',
                color: '#4338CA',
                '&:hover': {
                  bgcolor: '#E0E7FF'
                }
              }
            }}
          >
            <ToggleButton value="grid" aria-label="vista de cuadrícula">
              <ViewModule />
            </ToggleButton>
            <ToggleButton value="list" aria-label="vista de lista">
              <ViewList />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Barra de Acciones */}
        <Box 
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            mb: 3,
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between'
          }}
        >
          {/* Buscador */}
          <Box 
            sx={{
              position: 'relative',
              flex: { md: 1 },
              maxWidth: { md: '400px' }
            }}
          >
            <TextField
              fullWidth
              placeholder="Buscar archivos y carpetas..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => handleSearch('')}
                      sx={{ color: 'text.secondary' }}
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'background.paper'
                  }
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'divider'
                  },
                  '&:hover fieldset': {
                    borderColor: '#4338CA'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4338CA'
                  }
                }
              }}
            />
          </Box>

          {/* Botones de Acción */}
          <Box 
            sx={{ 
              display: 'flex',
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' }
            }}
          >
            <Button
              variant="contained"
              startIcon={<CreateNewFolder />}
              onClick={() => setOpenNewFolderDialog(true)}
              sx={{ 
                bgcolor: '#4338CA',
                '&:hover': { bgcolor: '#3730A3' },
                flex: { xs: '1', sm: 'initial' },
                px: 3,
                py: 1,
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Nueva Carpeta
            </Button>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadFile />}
              sx={{ 
                bgcolor: '#4338CA',
                '&:hover': { bgcolor: '#3730A3' },
                flex: { xs: '1', sm: 'initial' },
                px: 3,
                py: 1,
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Subir Archivo
              <input
                type="file"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
          </Box>
        </Box>

        {/* Breadcrumbs mejorado */}
        <Box 
          sx={{ 
            bgcolor: '#F3F4F6',
            borderRadius: 1.5,
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            mb: 2
          }}
        >
          <Breadcrumbs 
            separator={<NavigateNext fontSize="small" sx={{ color: '#6B7280' }} />}
            sx={{
              '& .MuiLink-root': {
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: '#374151',
                cursor: 'pointer',
                '&:hover': {
                  color: '#4338CA',
                  textDecoration: 'underline'
                }
              },
              '& .MuiLink-root:last-child': {
                color: '#4338CA',
                pointerEvents: 'none'
              }
            }}
          >
            {breadcrumbs.map((item, index) => (
              <Box
                key={item.id || 'home'}
                component="button"
                onClick={() => {
                  console.log('Click en breadcrumb:', item);
                  navigateToFolder(item.id);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: index === breadcrumbs.length - 1 ? '#4338CA' : '#374151',
                  '&:hover': {
                    color: '#4338CA',
                    textDecoration: 'underline'
                  }
                }}
              >
                {index === 0 ? (
                  <>
                    <Home sx={{ mr: 0.5, fontSize: 20 }} />
                    Inicio
                  </>
                ) : (
                  <Typography variant="body1" component="span">
                    {item.name}
                  </Typography>
                )}
              </Box>
            ))}
          </Breadcrumbs>
        </Box>

        {/* Mostrar mensaje de error si existe */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            {error}
          </Alert>
        )}
      </Paper>

      {/* Mostrar resultados de búsqueda o contenido normal */}
      {searchQuery.trim() ? (
        <div>
          <Typography variant="h6" gutterBottom>
            Resultados de búsqueda para "{searchQuery}"
          </Typography>
          {isSearching ? (
            <CircularProgress />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Carpetas encontradas */}
              {searchResults.folders.map((folder) => (
                <Card 
                  key={folder.id} 
                  className="hover:shadow-lg transition-shadow"
                  onClick={() => loadFolderContents(folder.id)}
                  sx={{ 
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': { 
                      bgcolor: '#EEF2FF',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out',
                      '& .folder-actions': {
                        opacity: 1,
                        visibility: 'visible'
                      }
                    }
                  }}
                >
                  <CardContent>
                    <div className="flex items-center">
                      <FolderIcon sx={{ color: '#4338CA', mr: 1 }} />
                      <Typography variant="subtitle1">{folder.name}</Typography>
                    </div>
                    {folder.description && (
                      <Typography variant="body2" color="textSecondary" className="mt-1">
                        {folder.description}
                      </Typography>
                    )}
                    <Box 
                      className="folder-actions"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        opacity: 0,
                        visibility: 'hidden',
                        transition: 'all 0.2s ease-in-out',
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        display: 'flex',
                        gap: 0.5,
                        zIndex: 1
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenEditDialog(folder);
                        }}
                        sx={{
                          p: 0.5,
                          '&:hover': {
                            color: 'primary.main',
                            bgcolor: 'rgba(67, 56, 202, 0.1)'
                          }
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(folder, true);
                        }}
                        sx={{
                          p: 0.5,
                          '&:hover': {
                            color: 'error.main',
                            bgcolor: 'rgba(239, 68, 68, 0.1)'
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {/* Archivos encontrados */}
              {searchResults.files.map((file) => (
                <Card 
                  key={file.id} 
                  className="hover:shadow-lg transition-shadow"
                  sx={{ 
                    position: 'relative',
                    '&:hover': { 
                      bgcolor: '#EEF2FF',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out',
                      '& .file-actions': {
                        opacity: 1,
                        visibility: 'visible'
                      }
                    }
                  }}
                >
                  <CardContent>
                    <div className="flex items-center">
                      {getFileIcon(file)}
                      <Typography variant="subtitle1" className="ml-2">
                        {file.name}
                      </Typography>
                    </div>
                    <Typography variant="body2" color="textSecondary" className="mt-1">
                      {file.formatted_size}
                    </Typography>
                    <Box 
                      className="file-actions"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        opacity: 0,
                        visibility: 'hidden',
                        transition: 'all 0.2s ease-in-out',
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        display: 'flex',
                        gap: 0.5,
                        zIndex: 1
                      }}
                    >
                      <IconButton 
                        size="small"
                        onClick={() => handleDownloadFile(file)}
                        sx={{
                          p: 0.5,
                          '&:hover': {
                            color: 'primary.main',
                            bgcolor: 'rgba(67, 56, 202, 0.1)'
                          }
                        }}
                      >
                        <Download fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => handleDelete(file)}
                        sx={{
                          p: 0.5,
                          '&:hover': {
                            color: 'error.main',
                            bgcolor: 'rgba(239, 68, 68, 0.1)'
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {!isSearching && searchResults.folders.length === 0 && searchResults.files.length === 0 && (
                <Typography variant="body1" color="textSecondary" className="col-span-full text-center py-8">
                  No se encontraron resultados para "{searchQuery}"
                </Typography>
              )}
            </div>
          )}
        </div>
      ) : (
        viewMode === 'grid' ? (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Carpetas */}
            {folders.map((folder) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={folder.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { 
                      bgcolor: '#EEF2FF',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out',
                      '& .folder-actions': {
                        opacity: 1,
                        visibility: 'visible'
                      }
                    },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none',
                    bgcolor: 'white'
                  }}
                  onClick={() => loadFolderContents(folder.id)}
                >
                  <CardContent 
                    sx={{ 
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2,
                      '&:last-child': {
                        pb: 2
                      }
                    }}
                  >
                    <Box 
                      sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative'
                      }}
                    >
                      <FolderIcon 
                        sx={{ 
                          fontSize: 64,
                          color: '#4338CA',
                          mb: 1
                        }} 
                      />
                      <Typography 
                        variant="body1"
                        align="center"
                        sx={{
                          fontWeight: 500,
                          width: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          px: 1
                        }}
                      >
                        {folder.name}
                      </Typography>
                      {folder.description && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          align="center"
                          sx={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%',
                            px: 1
                          }}
                        >
                          {folder.description}
                        </Typography>
                      )}
                      <Box 
                        className="folder-actions"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          opacity: 0,
                          visibility: 'hidden',
                          transition: 'all 0.2s ease-in-out',
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          display: 'flex',
                          gap: 0.5
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenEditDialog(folder);
                          }}
                          sx={{
                            p: 0.5,
                            '&:hover': {
                              color: 'primary.main',
                              bgcolor: 'rgba(67, 56, 202, 0.1)'
                            }
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(folder, true);
                          }}
                          sx={{
                            p: 0.5,
                            '&:hover': {
                              color: 'error.main',
                              bgcolor: 'rgba(239, 68, 68, 0.1)'
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {/* Archivos */}
            {files.map((file) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={file.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none',
                    bgcolor: 'white',
                    '&:hover': { 
                      bgcolor: '#EEF2FF',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out',
                      '& .file-actions': {
                        opacity: 1,
                        visibility: 'visible'
                      }
                    }
                  }}
                >
                  <CardContent 
                    sx={{ 
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2,
                      '&:last-child': {
                        pb: 2
                      }
                    }}
                  >
                    <Box 
                      sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative'
                      }}
                    >
                      <Box 
                        sx={{ 
                          fontSize: 64,
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {getFileIcon(file)}
                      </Box>
                      <Typography 
                        variant="body1"
                        align="center"
                        sx={{
                          fontWeight: 500,
                          width: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          px: 1
                        }}
                      >
                        {file.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        align="center"
                        sx={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                          px: 1
                        }}
                      >
                        {file.formatted_size}
                      </Typography>
                      <Box 
                        className="file-actions"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          opacity: 0,
                          visibility: 'hidden',
                          transition: 'all 0.2s ease-in-out',
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          display: 'flex',
                          gap: 0.5
                        }}
                      >
                        <IconButton 
                          size="small"
                          onClick={() => handleDownloadFile(file)}
                          sx={{
                            p: 0.5,
                            '&:hover': {
                              color: 'primary.main',
                              bgcolor: 'rgba(67, 56, 202, 0.1)'
                            }
                          }}
                        >
                          <Download fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => handleDelete(file)}
                          sx={{
                            p: 0.5,
                            '&:hover': {
                              color: 'error.main',
                              bgcolor: 'rgba(239, 68, 68, 0.1)'
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {folders.length === 0 && files.length === 0 && (
              <Grid item xs={12}>
                <Paper 
                  sx={{ 
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'white',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none'
                  }}
                >
                  <FolderIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Esta carpeta está vacía
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Crea una nueva carpeta o sube archivos para empezar
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        ) : (
          <Paper 
            elevation={0}
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <List>
              {/* Carpetas en vista de lista */}
              {folders.map((folder) => (
                <ListItem
                  key={folder.id}
                  button
                  onClick={() => loadFolderContents(folder.id)}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: '#EEF2FF'
                    }
                  }}
                >
                  <ListItemIcon>
                    <FolderIcon sx={{ color: '#4338CA' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={folder.name}
                    secondary={folder.description}
                    primaryTypographyProps={{
                      variant: 'subtitle1'
                    }}
                    secondaryTypographyProps={{
                      sx: {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical'
                      }
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenEditDialog(folder);
                      }}
                      sx={{
                        mr: 1,
                        '&:hover': {
                          color: 'primary.main',
                          bgcolor: 'rgba(67, 56, 202, 0.1)'
                        }
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(folder, true);
                      }}
                      sx={{
                        '&:hover': {
                          color: 'error.main'
                        }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}

              {/* Archivos en vista de lista */}
              {files.map((file) => (
                <ListItem
                  key={file.id}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: '#EEF2FF'
                    }
                  }}
                >
                  <ListItemIcon>
                    {getFileIcon(file)}
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={file.formatted_size}
                    primaryTypographyProps={{
                      variant: 'subtitle1'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDownloadFile(file)}
                      sx={{
                        mr: 1,
                        '&:hover': {
                          color: 'primary.main'
                        }
                      }}
                    >
                      <Download />
                    </IconButton>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDelete(file)}
                      sx={{
                        '&:hover': {
                          color: 'error.main'
                        }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}

              {/* Estado vacío en vista de lista */}
              {folders.length === 0 && files.length === 0 && (
                <ListItem
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    py: 4
                  }}
                >
                  <FolderIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Esta carpeta está vacía
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Crea una nueva carpeta o sube archivos para empezar
                  </Typography>
                </ListItem>
              )}
            </List>
          </Paper>
        )
      )}

      {/* Diálogo para nueva carpeta */}
      <Dialog
        open={openNewFolderDialog}
        onClose={() => setOpenNewFolderDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Nueva Carpeta</DialogTitle>
        <Divider />
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre de la carpeta"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción (opcional)"
            fullWidth
            multiline
            rows={3}
            value={newFolderDescription}
            onChange={(e) => setNewFolderDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={() => setOpenNewFolderDialog(false)}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateFolder}
            variant="contained"
            sx={{ 
              bgcolor: '#4338CA',
              '&:hover': { bgcolor: '#3730A3' }
            }}
          >
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Agregar el diálogo de edición de carpeta */}
      <Dialog
        open={openEditFolderDialog}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Editar Carpeta</DialogTitle>
        <Divider />
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre de la carpeta"
            fullWidth
            value={editFolderName}
            onChange={(e) => setEditFolderName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción (opcional)"
            fullWidth
            multiline
            rows={3}
            value={editFolderDescription}
            onChange={(e) => setEditFolderDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={handleCloseEditDialog}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEditFolder}
            variant="contained"
            sx={{ 
              bgcolor: '#4338CA',
              '&:hover': { bgcolor: '#3730A3' }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Delete sx={{ color: 'error.main' }} />
          Confirmar eliminación
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ mt: 2 }}>
          <Typography>
            ¿Estás seguro de que deseas eliminar {isFolder ? 'la carpeta' : 'el archivo'} 
            <Box component="span" sx={{ fontWeight: 600 }}> "{itemToDelete?.name}"</Box>?
          </Typography>
          {isFolder && (
            <Typography color="error" sx={{ mt: 2 }}>
              ⚠️ Esta acción también eliminará todos los archivos y subcarpetas contenidos.
            </Typography>
          )}
          <Typography sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmDelete}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FileManagerPage; 