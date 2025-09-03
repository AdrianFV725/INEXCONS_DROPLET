import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import { AuthProvider } from './context/AuthContext'
import LoginPage from './pages/public/LoginPage'
import ForgotPasswordPage from './pages/public/ForgotPasswordPage'
import ResetPasswordPage from './pages/public/ResetPasswordPage'
import DashboardPage from './pages/admin/DashboardPage'
import ProyectosPage from './pages/admin/ProyectosPage'
import ProyectoFormPage from './pages/admin/ProyectoFormPage'
import ProyectoDetallePage from './pages/admin/ProyectoDetallePage'
import ProyectosHistorialPage from './pages/admin/ProyectosHistorialPage'
import TrabajadoresPage from './pages/admin/TrabajadoresPage'
import TrabajadorFormPage from './pages/admin/TrabajadorFormPage'
import TrabajadorDetallePage from './pages/admin/TrabajadorDetallePage'
import ContratistasPage from './pages/admin/ContratistasPage'
import ContratistaFormPage from './pages/admin/ContratistaFormPage'
import ContratistaDetallePage from './pages/admin/ContratistaDetallePage'
import ContratistaDashboardPage from './pages/admin/ContratistaDashboardPage'
import EspecialidadesPage from './pages/admin/EspecialidadesPage'
import GastosGeneralesPage from './pages/admin/GastosGeneralesPage'
import ProspectosPage from './pages/admin/ProspectosPage'
import ProspectoFormPage from './pages/admin/ProspectoFormPage'
import ProspectoDetallePage from './pages/admin/ProspectoDetallePage'
import ProspectosHistorialPage from './pages/admin/ProspectosHistorialPage'
import NominasSemanalPage from './pages/admin/NominasSemanalPage'
import NominaSemanalDetallePage from './pages/admin/NominaSemanalDetallePage'
import FileManagerPage from './pages/admin/FileManagerPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirigir la ruta raíz al login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Rutas de autenticación sin layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Rutas del admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="proyectos" element={<ProyectosPage />} />
            <Route path="proyectos/nuevo" element={<ProyectoFormPage />} />
            <Route path="proyectos/:id" element={<ProyectoDetallePage />} />
            <Route path="proyectos/editar/:id" element={<ProyectoFormPage />} />
            <Route path="proyectos-historial" element={<ProyectosHistorialPage />} />
            <Route path="prospectos" element={<ProspectosPage />} />
            <Route path="prospectos/nuevo" element={<ProspectoFormPage />} />
            <Route path="prospectos/:id" element={<ProspectoDetallePage />} />
            <Route path="prospectos/editar/:id" element={<ProspectoFormPage />} />
            <Route path="prospectos-historial" element={<ProspectosHistorialPage />} />
            <Route path="trabajadores" element={<TrabajadoresPage />} />
            <Route path="trabajadores/nuevo" element={<TrabajadorFormPage />} />
            <Route path="trabajadores/:id" element={<TrabajadorDetallePage />} />
            <Route path="trabajadores/editar/:id" element={<TrabajadorFormPage />} />
            <Route path="contratistas" element={<ContratistasPage />} />
            <Route path="contratistas/nuevo" element={<ContratistaFormPage />} />
            <Route path="contratistas/:id" element={<ContratistaDetallePage />} />
            <Route path="contratistas/:id/dashboard" element={<ContratistaDashboardPage />} />
            <Route path="contratistas/editar/:id" element={<ContratistaFormPage />} />
            <Route path="especialidades" element={<EspecialidadesPage />} />
            <Route path="gastos-generales" element={<GastosGeneralesPage />} />
            <Route path="nomina-semanal" element={<NominasSemanalPage />} />
            <Route path="nomina-semanal/:id" element={<NominaSemanalDetallePage />} />
            <Route path="archivos" element={<FileManagerPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
