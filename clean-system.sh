#!/bin/bash

# Script para limpiar el sistema antes del deploy
# Uso: sudo bash clean-system.sh

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "🧹 Limpiando sistema para deploy limpio..."

# Limpiar repositorios problemáticos de PHP
print_status "Eliminando repositorios problemáticos de PHP..."
sudo rm -f /etc/apt/sources.list.d/ondrej-ubuntu-php-*.sources
sudo rm -f /etc/apt/sources.list.d/ondrej-php.list
sudo rm -f /etc/apt/sources.list.d/ondrej-*.list

# Limpiar claves GPG problemáticas
print_status "Limpiando claves GPG problemáticas..."
sudo rm -f /etc/apt/keyrings/ondrej-*.gpg

# Limpiar caché de APT
print_status "Limpiando caché de APT..."
sudo apt clean
sudo apt autoclean

# Actualizar lista de paquetes
print_status "Actualizando lista de paquetes..."
sudo apt update 2>/dev/null

# Verificar PHP instalado
if command -v php8.2 &> /dev/null; then
    print_warning "PHP 8.2 ya está instalado:"
    php8.2 --version | head -1
    
    read -p "¿Deseas reinstalar PHP? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Removiendo PHP existente..."
        sudo apt remove --purge -y php8.2* 2>/dev/null || true
        sudo apt autoremove -y
    fi
fi

# Verificar servicios existentes de INEXCONS
if systemctl list-unit-files | grep -q inexcons; then
    print_warning "Servicios INEXCONS existentes detectados"
    
    print_status "Deteniendo servicios existentes..."
    sudo systemctl stop inexcons-backend 2>/dev/null || true
    sudo systemctl stop inexcons-frontend 2>/dev/null || true
    sudo systemctl disable inexcons-backend 2>/dev/null || true
    sudo systemctl disable inexcons-frontend 2>/dev/null || true
    
    print_status "Eliminando archivos de servicio antiguos..."
    sudo rm -f /etc/systemd/system/inexcons-*.service
    sudo systemctl daemon-reload
fi

# Limpiar instalación anterior si existe
VOLUME_PATH="/mnt/volume_nyc1_01"
PROJECT_DIR="$VOLUME_PATH/inexcons"

if [ -d "$PROJECT_DIR" ]; then
    print_warning "Instalación anterior detectada en $PROJECT_DIR"
    
    read -p "¿Deseas hacer backup antes de limpiar? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        BACKUP_DIR="$VOLUME_PATH/backups/inexcons_$(date +%Y%m%d_%H%M%S)"
        print_status "Creando backup en $BACKUP_DIR..."
        sudo mkdir -p "$BACKUP_DIR"
        
        if [ -f "$PROJECT_DIR/backend/database/database.sqlite" ]; then
            sudo cp "$PROJECT_DIR/backend/database/database.sqlite" "$BACKUP_DIR/"
            print_success "Base de datos respaldada"
        fi
        
        if [ -d "$PROJECT_DIR/backend/storage" ]; then
            sudo cp -r "$PROJECT_DIR/backend/storage" "$BACKUP_DIR/"
            print_success "Archivos de storage respaldados"
        fi
    fi
    
    print_status "Eliminando instalación anterior..."
    sudo rm -rf "$PROJECT_DIR"
fi

# Limpiar configuración de Nginx si existe
if [ -f "/etc/nginx/sites-available/inexcons" ]; then
    print_status "Eliminando configuración anterior de Nginx..."
    sudo rm -f /etc/nginx/sites-available/inexcons
    sudo rm -f /etc/nginx/sites-enabled/inexcons
fi

# Limpiar enlaces simbólicos
print_status "Eliminando enlaces simbólicos anteriores..."
sudo rm -f /usr/local/bin/inexcons-*

# Mostrar estado final
print_status "Verificando limpieza..."

echo "📊 Estado del sistema:"
echo "  • PHP 8.2: $(command -v php8.2 >/dev/null && echo "Instalado" || echo "No instalado")"
echo "  • Servicios INEXCONS: $(systemctl list-unit-files | grep -c inexcons || echo "0") encontrados"
echo "  • Proyecto anterior: $([ -d "$PROJECT_DIR" ] && echo "Existe" || echo "Eliminado")"
echo "  • Configuración Nginx: $([ -f "/etc/nginx/sites-available/inexcons" ] && echo "Existe" || echo "Eliminada")"

print_success "🎉 Sistema limpio y listo para deploy"
print_status "Ahora puedes ejecutar: sudo bash deploy.sh"
