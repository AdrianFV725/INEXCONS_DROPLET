#!/bin/bash

# Script para limpiar repositorios APT y migrar claves Docker
# Uso: sudo bash scripts/fix_apt_repos.sh

set -e

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

# Verificar permisos de root
if [ "$EUID" -ne 0 ]; then
    print_error "Este script debe ejecutarse como root (usa sudo)"
    exit 1
fi

print_status "🧹 Iniciando limpieza de repositorios APT..."

# 1. Eliminar PPA de Ondrej completamente
print_status "Eliminando repositorios PPA de Ondrej..."

# Eliminar archivos de repositorio
rm -f /etc/apt/sources.list.d/ondrej-ubuntu-php-*.sources
rm -f /etc/apt/sources.list.d/ondrej-php.*
rm -f /etc/apt/sources.list.d/ondrej-*.list
rm -f /etc/apt/sources.list.d/ondrej-*.sources

# Eliminar claves GPG de Ondrej
rm -f /etc/apt/keyrings/ondrej-*.gpg

print_success "✅ Repositorios PPA de Ondrej eliminados"

# 2. Migrar clave Docker del keyring legacy
print_status "Migrando clave Docker a keyring moderno..."

# Crear directorio para claves modernas
mkdir -p /etc/apt/keyrings

# Verificar si Docker está usando keyring legacy
if [ -f /etc/apt/trusted.gpg ] && gpg --no-default-keyring --keyring /etc/apt/trusted.gpg --list-keys | grep -q docker; then
    print_warning "Detectada clave Docker en keyring legacy"
    
    # Exportar clave Docker del keyring legacy
    gpg --no-default-keyring --keyring /etc/apt/trusted.gpg --export 9DC858229FC7DD38854AE2D88D81803C0EBFCD88 | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Actualizar configuración de repositorio Docker
    if [ -f /etc/apt/sources.list.d/docker.list ]; then
        # Backup del archivo original
        cp /etc/apt/sources.list.d/docker.list /etc/apt/sources.list.d/docker.list.backup
        
        # Crear nueva configuración con signed-by
        cat > /etc/apt/sources.list.d/docker.sources << 'EOF'
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: oracular
Components: stable
Signed-By: /etc/apt/keyrings/docker.gpg
EOF
        
        # Eliminar archivo .list antiguo
        rm -f /etc/apt/sources.list.d/docker.list
        
        print_success "✅ Repositorio Docker migrado a formato moderno"
    fi
    
    # Verificar nueva clave
    if [ -f /etc/apt/keyrings/docker.gpg ]; then
        print_success "✅ Clave Docker migrada exitosamente"
    else
        print_error "❌ Error migrando clave Docker"
        
        # Método alternativo: descargar clave directamente
        print_status "Intentando descarga directa de clave Docker..."
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        
        if [ -f /etc/apt/keyrings/docker.gpg ]; then
            print_success "✅ Clave Docker descargada exitosamente"
        fi
    fi
else
    print_status "Verificando configuración actual de Docker..."
    
    # Si no hay clave legacy, asegurar configuración moderna
    if ! [ -f /etc/apt/keyrings/docker.gpg ]; then
        print_status "Descargando clave Docker..."
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    fi
    
    # Asegurar configuración moderna
    if [ -f /etc/apt/sources.list.d/docker.list ] && ! [ -f /etc/apt/sources.list.d/docker.sources ]; then
        print_status "Actualizando configuración Docker a formato moderno..."
        
        cat > /etc/apt/sources.list.d/docker.sources << 'EOF'
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: oracular
Components: stable
Signed-By: /etc/apt/keyrings/docker.gpg
EOF
        
        rm -f /etc/apt/sources.list.d/docker.list
        print_success "✅ Configuración Docker actualizada"
    fi
fi

# 3. Limpiar caché de APT
print_status "Limpiando caché de APT..."
apt clean
apt autoclean

# 4. Actualizar lista de paquetes
print_status "Actualizando lista de paquetes..."
if apt update 2>&1 | tee /tmp/apt_update.log; then
    print_success "✅ apt update ejecutado exitosamente"
else
    print_warning "⚠️ apt update completado con advertencias"
fi

# Verificar errores específicos
if grep -q "NO_PUBKEY\|invalid\|untrusted" /tmp/apt_update.log; then
    print_warning "⚠️ Aún hay problemas de claves GPG detectados:"
    grep -E "NO_PUBKEY|invalid|untrusted" /tmp/apt_update.log || true
    echo ""
    print_status "Ejecutando limpieza adicional..."
    
    # Limpiar claves problemáticas adicionales
    apt-key list 2>/dev/null | grep -B 2 -A 2 "expired\|invalid" | grep "pub" | cut -d'/' -f2 | cut -d' ' -f1 | while read key; do
        if [ -n "$key" ]; then
            print_status "Eliminando clave problemática: $key"
            apt-key del "$key" 2>/dev/null || true
        fi
    done
fi

# 5. Actualizar sistema
print_status "Actualizando paquetes del sistema..."
if apt-get -y upgrade; then
    print_success "✅ Sistema actualizado exitosamente"
else
    print_warning "⚠️ Actualización completada con advertencias"
fi

# 6. Verificar estado final
print_status "Verificando estado final del sistema APT..."

echo ""
echo "📊 Resumen de limpieza:"
echo "  • Repositorios Ondrej: $(ls /etc/apt/sources.list.d/ondrej* 2>/dev/null | wc -l) archivos restantes"
echo "  • Clave Docker moderna: $([ -f /etc/apt/keyrings/docker.gpg ] && echo "✅ Presente" || echo "❌ Ausente")"
echo "  • Configuración Docker: $([ -f /etc/apt/sources.list.d/docker.sources ] && echo "✅ Moderna" || echo "⚠️ Legacy")"

# Verificar warnings en última actualización
if grep -q "Warning\|Error" /tmp/apt_update.log; then
    print_warning "⚠️ Advertencias detectadas en apt update:"
    grep -E "Warning|Error" /tmp/apt_update.log | head -5
else
    print_success "✅ apt update sin advertencias"
fi

# Limpiar archivo temporal
rm -f /tmp/apt_update.log

print_success "🎉 Limpieza de repositorios APT completada"
print_status "Ejecuta 'apt update' nuevamente para verificar que no hay errores"

