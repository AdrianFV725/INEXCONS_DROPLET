#!/bin/bash

# Script de mantenimiento para INEXCONS
# Incluye backups, limpieza de logs, y verificación del sistema

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
VOLUME_PATH="/mnt/volume_nyc1_01"
PROJECT_DIR="$VOLUME_PATH/inexcons"
BACKUP_DIR="$VOLUME_PATH/backups/inexcons"
LOG_DIR="$PROJECT_DIR/backend/storage/logs"

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

# Función para hacer backup de la base de datos
backup_database() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/database_$timestamp.sqlite"
    
    print_status "💾 Creando backup de la base de datos..."
    
    # Crear directorio de backup si no existe
    sudo mkdir -p $BACKUP_DIR
    
    # Copiar base de datos
    if [ -f "$PROJECT_DIR/backend/database/database.sqlite" ]; then
        sudo cp "$PROJECT_DIR/backend/database/database.sqlite" "$backup_file"
        sudo chown root:root "$backup_file"
        sudo chmod 644 "$backup_file"
        print_success "Backup creado: $backup_file"
        
        # Verificar integridad del backup
        if sqlite3 "$backup_file" "PRAGMA integrity_check;" | grep -q "ok"; then
            print_success "✅ Integridad del backup verificada"
        else
            print_error "❌ Error en la integridad del backup"
            return 1
        fi
    else
        print_error "❌ No se encontró la base de datos"
        return 1
    fi
}

# Función para limpiar backups antiguos (mantener últimos 10)
cleanup_old_backups() {
    print_status "🧹 Limpiando backups antiguos..."
    
    if [ -d "$BACKUP_DIR" ]; then
        # Mantener solo los últimos 10 backups
        cd "$BACKUP_DIR"
        ls -t database_*.sqlite 2>/dev/null | tail -n +11 | xargs -r sudo rm -f
        
        local remaining=$(ls database_*.sqlite 2>/dev/null | wc -l)
        print_success "Backups mantenidos: $remaining"
    fi
}

# Función para limpiar logs antiguos
cleanup_logs() {
    print_status "🧹 Limpiando logs antiguos..."
    
    # Limpiar logs de Laravel (mantener últimos 7 días)
    if [ -d "$LOG_DIR" ]; then
        find "$LOG_DIR" -name "*.log" -type f -mtime +7 -delete
        print_success "Logs de Laravel limpiados"
    fi
    
    # Limpiar logs de systemd (mantener últimos 30 días)
    sudo journalctl --vacuum-time=30d
    print_success "Logs de systemd limpiados"
    
    # Limpiar logs de nginx (comprimir logs antiguos)
    sudo find /var/log/nginx -name "*.log" -type f -mtime +7 -exec gzip {} \;
    sudo find /var/log/nginx -name "*.gz" -type f -mtime +30 -delete
    print_success "Logs de Nginx limpiados"
}

# Función para verificar espacio en disco
check_disk_space() {
    print_status "💾 Verificando espacio en disco..."
    
    local usage=$(df -h "$VOLUME_PATH" | awk 'NR==2 {print $5}' | sed 's/%//')
    
    echo "Uso del volumen principal: ${usage}%"
    
    if [ "$usage" -gt 85 ]; then
        print_warning "⚠️ Espacio en disco bajo: ${usage}%"
        
        # Mostrar directorios que más espacio ocupan
        print_status "Directorios con mayor uso:"
        sudo du -h "$PROJECT_DIR" | sort -hr | head -10
        
        return 1
    else
        print_success "✅ Espacio en disco adecuado: ${usage}%"
    fi
}

# Función para verificar servicios
check_services() {
    print_status "🔍 Verificando servicios..."
    
    local services=("inexcons-backend" "inexcons-frontend" "nginx")
    local all_ok=true
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service"; then
            print_success "✅ $service está activo"
        else
            print_error "❌ $service está inactivo"
            all_ok=false
        fi
    done
    
    if [ "$all_ok" = true ]; then
        print_success "✅ Todos los servicios están funcionando correctamente"
    else
        print_warning "⚠️ Algunos servicios requieren atención"
        return 1
    fi
}

# Función para optimizar Laravel
optimize_laravel() {
    print_status "⚡ Optimizando Laravel..."
    
    cd "$PROJECT_DIR/backend"
    
    # Limpiar caché
    sudo -u www-data php artisan cache:clear
    sudo -u www-data php artisan config:clear
    sudo -u www-data php artisan route:clear
    sudo -u www-data php artisan view:clear
    
    # Regenerar caché
    sudo -u www-data php artisan config:cache
    sudo -u www-data php artisan route:cache
    sudo -u www-data php artisan view:cache
    
    print_success "✅ Laravel optimizado"
}

# Función para verificar actualizaciones del sistema
check_system_updates() {
    print_status "🔄 Verificando actualizaciones del sistema..."
    
    sudo apt update > /dev/null 2>&1
    local updates=$(apt list --upgradable 2>/dev/null | grep -c upgradable)
    
    if [ "$updates" -gt 0 ]; then
        print_warning "⚠️ Hay $updates actualizaciones disponibles"
        echo "Ejecuta 'sudo apt upgrade' para actualizar el sistema"
    else
        print_success "✅ Sistema actualizado"
    fi
}

# Función principal
main() {
    case "$1" in
        backup)
            backup_database
            ;;
        
        cleanup)
            cleanup_old_backups
            cleanup_logs
            ;;
        
        check)
            check_disk_space
            check_services
            check_system_updates
            ;;
        
        optimize)
            optimize_laravel
            ;;
        
        full)
            print_status "🔧 Ejecutando mantenimiento completo..."
            echo ""
            
            backup_database && \
            cleanup_old_backups && \
            cleanup_logs && \
            check_disk_space && \
            check_services && \
            optimize_laravel && \
            check_system_updates
            
            if [ $? -eq 0 ]; then
                print_success "🎉 Mantenimiento completado exitosamente"
            else
                print_warning "⚠️ Mantenimiento completado con advertencias"
            fi
            ;;
        
        *)
            echo "Script de mantenimiento para INEXCONS"
            echo ""
            echo "Uso: $0 [comando]"
            echo ""
            echo "Comandos disponibles:"
            echo "  backup    - Crear backup de la base de datos"
            echo "  cleanup   - Limpiar backups y logs antiguos"
            echo "  check     - Verificar estado del sistema y servicios"
            echo "  optimize  - Optimizar Laravel (limpiar y regenerar caché)"
            echo "  full      - Ejecutar mantenimiento completo"
            echo ""
            echo "Ejemplos:"
            echo "  $0 backup"
            echo "  $0 full"
            echo ""
            exit 1
            ;;
    esac
}

# Verificar que el script se ejecute como root o con sudo
if [ "$EUID" -ne 0 ] && [ -z "$SUDO_USER" ]; then
    print_error "Este script requiere permisos de root o sudo"
    exit 1
fi

main "$@"