import axios from '../utils/axiosConfig';

/**
 * Servicio para gestionar archivos y carpetas
 */
const fileManagerService = {
    /**
     * Obtener el contenido de una carpeta
     * @param {number|null} folderId - ID de la carpeta (null para la raíz)
     * @returns {Promise} - Promesa con la respuesta del servidor
     */
    getFolderContents: async (folderId = null) => {
        try {
            console.log('Obteniendo contenido de carpeta:', folderId);
            const url = folderId ? `/file-manager/folders/${folderId}` : '/file-manager/folders';
            console.log('URL de la petición:', url);
            const response = await axios.get(url);
            console.log('Respuesta del servidor:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error al obtener contenido de la carpeta:', error);
            if (error.response) {
                console.error('Respuesta del error:', error.response.data);
                console.error('Estado del error:', error.response.status);
                
                // Si el error es de autenticación, redirigir al login
                if (error.response.status === 401) {
                    window.location.href = '/login';
                    return;
                }
                
                // Si el error es 404, retornar una estructura vacía
                if (error.response.status === 404) {
                    return {
                        success: true,
                        currentFolder: null,
                        folders: [],
                        files: [],
                        breadcrumbs: [{ id: null, name: 'Inicio', parent_id: null }]
                    };
                }
            }
            throw error;
        }
    },

    /**
     * Crear una nueva carpeta
     * @param {Object} data - Datos de la carpeta
     * @returns {Promise} - Promesa con la respuesta del servidor
     */
    createFolder: async (data) => {
        try {
            const response = await axios.post('/file-manager/folders', data);
            return response.data;
        } catch (error) {
            console.error('Error al crear carpeta:', error);
            throw error;
        }
    },

    /**
     * Eliminar una carpeta
     * @param {number} folderId - ID de la carpeta
     * @returns {Promise} - Promesa con la respuesta del servidor
     */
    deleteFolder: async (folderId) => {
        try {
            const response = await axios.delete(`/file-manager/folders/${folderId}`);
            return response.data;
        } catch (error) {
            console.error('Error al eliminar carpeta:', error);
            throw error;
        }
    },

    /**
     * Subir un archivo
     * @param {FormData} formData - Datos del archivo y carpeta
     * @returns {Promise} - Promesa con la respuesta del servidor
     */
    uploadFile: async (formData) => {
        try {
            // Verificar que el FormData contiene un archivo
            if (!formData.has('file')) {
                console.error('FormData no contiene archivo');
                throw new Error('No se ha proporcionado ningún archivo');
            }

            // Verificar el contenido del FormData
            console.log('Contenido del FormData:');
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + (pair[0] === 'file' ? pair[1].name : pair[1]));
            }

            const response = await axios.post('/file-manager/files', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 300000 // 5 minutos
            });
            return response.data;
        } catch (error) {
            console.error('Error al subir archivo:', error);
            if (error.response) {
                console.error('Respuesta del servidor:', error.response.data);
                console.error('Estado del error:', error.response.status);
                console.error('Headers de la respuesta:', error.response.headers);
                
                // Intentar obtener un mensaje de error más específico
                const errorMessage = error.response.data?.error || 
                                   error.response.data?.message || 
                                   'Error al subir el archivo';
                
                throw new Error(errorMessage);
            }
            throw error;
        }
    },

    /**
     * Descargar un archivo
     * @param {number} fileId - ID del archivo
     * @returns {Promise} - Promesa con la respuesta del servidor
     */
    downloadFile: async (fileId) => {
        try {
            const response = await axios.get(`/file-manager/files/${fileId}/download`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error al descargar archivo:', error);
            throw error;
        }
    },

    /**
     * Eliminar un archivo
     * @param {number} fileId - ID del archivo
     * @returns {Promise} - Promesa con la respuesta del servidor
     */
    deleteFile: async (fileId) => {
        try {
            const response = await axios.delete(`/file-manager/files/${fileId}`);
            return response.data;
        } catch (error) {
            console.error('Error al eliminar archivo:', error);
            throw error;
        }
    },

    /**
     * Actualizar una carpeta existente
     * @param {number} folderId - ID de la carpeta
     * @param {Object} data - Datos actualizados de la carpeta
     * @returns {Promise} - Promesa con la respuesta del servidor
     */
    updateFolder: async (folderId, data) => {
        try {
            const response = await axios.put(`/file-manager/folders/${folderId}`, data);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar carpeta:', error);
            throw error;
        }
    },

    searchFiles: async (query) => {
        try {
            const response = await axios.get('/file-manager/search', {
                params: { query }
            });
            return response.data;
        } catch (error) {
            console.error('Error al buscar archivos:', error);
            throw error;
        }
    }
};

export default fileManagerService; 