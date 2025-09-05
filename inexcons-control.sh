#!/bin/bash

# Script de control para servicios INEXCONS
# Uso: ./inexcons-control.sh [start|stop|restart|status|logs|enable|disable]

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Servicios de INEXCONS
BACKEND_SERVICE="inexcons-backend"
FRONTEND_SERVICE="inexcons-frontend"
NGINX_SERVICE="nginx"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_service_status() {
    local service=$1
    if systemctl is-active --quiet $service; then
        echo -e "${GREEN}✅ $service está activo${NC}"
    else
        echo -e "${RED}❌ $service está inactivo${NC}"
    fi
}

case "$1" in
    start)
        print_status "🚀 Iniciando servicios INEXCONS..."
        sudo systemctl start $BACKEND_SERVICE
        sudo systemctl start $FRONTEND_SERVICE
        sudo systemctl start $NGINX_SERVICE
        
        sleep 2
        check_service_status $BACKEND_SERVICE
        check_service_status $FRONTEND_SERVICE
        check_service_status $NGINX_SERVICE
        print_success "Servicios iniciados"
        ;;
    
    stop)
        print_status "🛑 Deteniendo servicios INEXCONS..."
        sudo systemctl stop $BACKEND_SERVICE
        sudo systemctl stop $FRONTEND_SERVICE
        
        sleep 2
        check_service_status $BACKEND_SERVICE
        check_service_status $FRONTEND_SERVICE
        print_success "Servicios detenidos"
        ;;
    
    restart)
        print_status "🔄 Reiniciando servicios INEXCONS..."
        sudo systemctl restart $BACKEND_SERVICE
        sudo systemctl restart $FRONTEND_SERVICE
        sudo systemctl reload $NGINX_SERVICE
        
        sleep 3
        check_service_status $BACKEND_SERVICE
        check_service_status $FRONTEND_SERVICE
        check_service_status $NGINX_SERVICE
        print_success "Servicios reiniciados"
        ;;
    
    status)
        print_status "📊 Estado de servicios INEXCONS:"
        echo ""
        echo "=== Backend (Laravel) ==="
        sudo systemctl status $BACKEND_SERVICE --no-pager -l
        echo ""
        echo "=== Frontend (React) ==="
        sudo systemctl status $FRONTEND_SERVICE --no-pager -l
        echo ""
        echo "=== Nginx ==="
        sudo systemctl status $NGINX_SERVICE --no-pager -l
        ;;
    
    logs)
        if [ -n "$2" ]; then
            case "$2" in
                backend)
                    print_status "📋 Logs del backend:"
                    sudo journalctl -u $BACKEND_SERVICE -f
                    ;;
                frontend)
                    print_status "📋 Logs del frontend:"
                    sudo journalctl -u $FRONTEND_SERVICE -f
                    ;;
                nginx)
                    print_status "📋 Logs de Nginx:"
                    sudo journalctl -u $NGINX_SERVICE -f
                    ;;
                *)
                    print_error "Servicio desconocido. Usa: backend, frontend, nginx"
                    exit 1
                    ;;
            esac
        else
            print_status "📋 Logs combinados de INEXCONS:"
            sudo journalctl -u $BACKEND_SERVICE -u $FRONTEND_SERVICE -f
        fi
        ;;
    
    enable)
        print_status "✅ Habilitando servicios INEXCONS para inicio automático..."
        sudo systemctl enable $BACKEND_SERVICE
        sudo systemctl enable $FRONTEND_SERVICE
        sudo systemctl enable $NGINX_SERVICE
        print_success "Servicios habilitados para inicio automático"
        ;;
    
    disable)
        print_status "❌ Deshabilitando servicios INEXCONS del inicio automático..."
        sudo systemctl disable $BACKEND_SERVICE
        sudo systemctl disable $FRONTEND_SERVICE
        print_warning "Nginx NO fue deshabilitado (puede afectar otros sitios)"
        print_success "Servicios INEXCONS deshabilitados del inicio automático"
        ;;
    
    *)
        echo "Script de control para servicios INEXCONS"
        echo ""
        echo "Uso: $0 [comando] [opciones]"
        echo ""
        echo "Comandos disponibles:"
        echo "  start     - Iniciar todos los servicios"
        echo "  stop      - Detener servicios INEXCONS"
        echo "  restart   - Reiniciar todos los servicios"
        echo "  status    - Mostrar estado de todos los servicios"
        echo "  logs      - Mostrar logs (opción: backend|frontend|nginx)"
        echo "  enable    - Habilitar inicio automático"
        echo "  disable   - Deshabilitar inicio automático"
        echo ""
        echo "Ejemplos:"
        echo "  $0 start"
        echo "  $0 logs backend"
        echo "  $0 status"
        echo ""
        exit 1
        ;;
esac
