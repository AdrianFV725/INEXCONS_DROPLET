import { Fragment, useState, useEffect, useRef } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Menu, Transition } from '@headlessui/react'
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  HomeIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  TagIcon,
  CalendarIcon,
  FolderIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Gastos INEX', href: '/admin/gastos-generales', icon: CurrencyDollarIcon },
  { name: 'Proyectos', href: '/admin/proyectos', icon: BriefcaseIcon },
  { name: 'Prospectos', href: '/admin/prospectos', icon: ClipboardDocumentListIcon },
  { name: 'Historial de Proyectos', href: '/admin/proyectos-historial', icon: ClipboardDocumentListIcon },
  { name: 'Trabajadores', href: '/admin/trabajadores', icon: UserGroupIcon },
  { name: 'Contratistas', href: '/admin/contratistas', icon: BuildingOfficeIcon },
  { name: 'Especialidades', href: '/admin/especialidades', icon: TagIcon },
  { name: 'Nómina Semanal', href: '/admin/nomina-semanal', icon: CalendarIcon },
  { name: 'Archivos', href: '/admin/archivos', icon: FolderIcon },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const menuContainerRef = useRef(null)

  // Cerrar el menú móvil cuando cambia la ruta
  useEffect(() => {
    const isMobile = window.innerWidth < 1024; // lg breakpoint en Tailwind
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  // Cerrar el menú móvil cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuButtonRef.current && menuButtonRef.current.contains(e.target)) {
        return;
      }

      if (menuContainerRef.current && menuContainerRef.current.contains(e.target)) {
        return;
      }

      if (isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Función para manejar el clic en el botón de hamburguesa
  const toggleSidebar = (e) => {
    e.stopPropagation();
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra superior */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center">
            <button
              ref={menuButtonRef}
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Abrir menú lateral</span>
              {isSidebarOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
            <Link to="/admin" className="ml-3 text-lg font-bold text-indigo-600">
              INEXCONS
            </Link>
          </div>

          <div className="flex items-center">
            <Menu as="div" className="relative">
              <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <span className="sr-only">Abrir menú de usuario</span>
                <UserIcon className="h-7 w-7 rounded-full bg-gray-100 p-1 text-gray-600" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-40 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={classNames(
                          active ? 'bg-gray-100' : '',
                          'w-full text-left block px-4 py-2 text-sm text-gray-700'
                        )}
                      >
                        Cerrar Sesión
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Menú lateral */}
        <div
          ref={menuContainerRef}
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 lg:z-0 lg:h-full`}
        >
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto pt-5">
              <nav className="px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => {
                      const isMobile = window.innerWidth < 1024;
                      if (isMobile) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={classNames(
                      item.href === location.pathname
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    )}
                  >
                    <item.icon
                      className={classNames(
                        item.href === location.pathname
                          ? 'text-indigo-500'
                          : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 flex-shrink-0 h-5 w-5'
                      )}
                    />
                    {item.name}
                    {item.href === location.pathname && (
                      <ChevronRightIcon className="ml-auto h-4 w-4 text-indigo-500" />
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <main className="flex-1 overflow-auto">
          <div className="py-4 sm:py-6">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
              <div className="min-h-[calc(100vh-10rem)]">
                <Outlet />
              </div>
            </div>
          </div>
        </main>

        {/* Overlay para móvil */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  )
} 