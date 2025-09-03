import axios from '../utils/axiosConfig';

/**
 * Servicio para manejar la autenticación con el backend
 */
const authService = {
  /**
   * Iniciar sesión
   * @param {Object} credentials - Credenciales del usuario (email, password)
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  login: async (credentials) => {
    try {
      console.log('=== Inicio de Login ===');
      console.log('Credenciales recibidas:', credentials);
      
      // Limpiar datos anteriores antes de intentar login
      localStorage.clear();
      
      // Asegurarse de que las credenciales estén en el formato correcto
      const loginData = {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password
      };
      
      console.log('Datos de login formateados:', loginData);
      
      const response = await axios.post('/login', loginData);
      console.log('Respuesta del servidor:', response.data);
      
      if (response.data && response.data.status === 'success') {
        // Guardar el token y el usuario en localStorage con un tiempo de expiración
        const expiresIn = 24 * 60 * 60 * 1000; // 24 horas
        const expiresAt = new Date().getTime() + expiresIn;
        
        // Guardar nuevos datos
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('expiresAt', expiresAt.toString());
        
        console.log('Login exitoso, datos guardados en localStorage');
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('=== Error en el Servicio de Login ===');
      console.error('Mensaje:', error.message);
      console.error('Respuesta:', error.response?.data);
      console.error('Status:', error.response?.status);
      console.error('Config:', error.config);
      console.error('=== Fin de Error ===');
      
      // Limpiar cualquier dato de sesión existente en caso de error
      localStorage.clear();
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 401) {
        throw new Error('Credenciales incorrectas. Por favor, verifica tu email y contraseña.');
      } else if (error.response?.status === 422) {
        throw new Error('Datos de inicio de sesión inválidos. Por favor, verifica el formato de tu email.');
      } else if (error.response?.status === 500) {
        throw new Error('Error del servidor. Por favor, intenta más tarde.');
      } else if (error.request) {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      } else {
        throw new Error('Error al procesar la solicitud: ' + error.message);
      }
    }
  },

  /**
   * Cerrar sesión
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  logout: async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post('/logout');
      }
    } catch (error) {
      console.error('Error en el servicio de logout:', error);
    } finally {
      // Siempre limpiar el localStorage, incluso si hay error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Recuperar contraseña
   * @param {Object} data - Datos para recuperar contraseña (email)
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  recuperarPassword: async (email) => {
    try {
      const response = await axios.post('/recuperar-password', { email });
      return response.data;
    } catch (error) {
      console.error('Error en el servicio de recuperación de contraseña:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Error al procesar la solicitud');
      } else {
        throw new Error('Error al conectar con el servidor');
      }
    }
  },

  /**
   * Obtener el usuario actual
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const response = await axios.get('/user');
      return response.data;
    } catch (error) {
      console.error('Error al obtener el usuario actual:', error);
      return null;
    }
  },

  /**
   * Verificar si el usuario está autenticado
   * @returns {Boolean} - True si el usuario está autenticado, false en caso contrario
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const expiresAt = localStorage.getItem('expiresAt');
    
    if (!token || !expiresAt) return false;
    
    // Verificar si el token ha expirado
    const now = new Date().getTime();
    if (now > parseInt(expiresAt)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('expiresAt');
      return false;
    }
    
    return true;
  },

  /**
   * Obtener el token de autenticación
   * @returns {String|null} - Token de autenticación o null si no hay token
   */
  getToken: () => {
    return localStorage.getItem('token');
  },

  /**
   * Obtener el usuario almacenado localmente
   * @returns {Object|null} - Usuario o null si no hay usuario
   */
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Solicitar recuperación de contraseña
   * @param {Object} data - Datos del usuario (email)
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  forgotPassword: async (data) => {
    try {
      const response = await axios.post('/recuperar-password', { email: data });
      return response.data;
    } catch (error) {
      console.error('Error al solicitar recuperación de contraseña:', error);
      throw error;
    }
  },

  /**
   * Restablecer contraseña
   * @param {Object} data - Datos para restablecer la contraseña (token, password, password_confirmation)
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  resetPassword: async (data) => {
    try {
      const response = await axios.post('/reset-password', data);
      return response.data;
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      throw error;
    }
  }
};

export default authService; 