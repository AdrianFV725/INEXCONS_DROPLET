import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Verificar si hay un usuario autenticado al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Intentar obtener el usuario desde localStorage
        const storedUser = authService.getUser()
        
        if (storedUser) {
          // Primero, establecer el usuario desde localStorage para evitar redirecciones
          setUser(storedUser)
          
          // Luego verificar que el token sigue siendo válido
          try {
            const currentUser = await authService.getCurrentUser()
            if (currentUser) {
              setUser(currentUser)
            } else {
              // Si el token no es válido, limpiar localStorage
              authService.logout()
              setUser(null)
            }
          } catch (error) {
            // Si hay error verificando el token, mantener el usuario de localStorage
            // y dejarlo que las rutas protegidas manejen la validación
            console.warn('Error verificando token, manteniendo usuario de localStorage:', error)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials)
      setUser(response.user)
      return response
    } catch (error) {
      console.error('Error de login:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      // Aún si hay error, eliminamos el usuario del estado
      setUser(null)
    }
  }

  const forgotPassword = async (email) => {
    try {
      return await authService.forgotPassword({ email })
    } catch (error) {
      console.error('Error al solicitar recuperación de contraseña:', error)
      throw error
    }
  }

  const resetPassword = async (data) => {
    try {
      return await authService.resetPassword(data)
    } catch (error) {
      console.error('Error al restablecer contraseña:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        forgotPassword,
        resetPassword,
        isAuthenticated: () => !!user,
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
} 