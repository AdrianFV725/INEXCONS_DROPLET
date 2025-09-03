#!/bin/bash

# Script de mantenimiento para INEXCONS
# Ejecutar semanalmente para mantener el sistema optimizado

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

VOLUME_PATH="/mnt/volume_nyc1_01"
PROJECT_DIR="$VOLUME_PATH/inexcons"
BACKUP_DIR="$VOLUME_PATH/backups/inexcons"
LOG_FILE="$VOLUME_PATH/logs/inexcons-maintenance.log"

# Función para logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

print_status "🔧 Iniciando mantenimiento de INEXCONS..."
log "Iniciando mantenimiento"

# Crear directorios si no existen
sudo mkdir -p $BACKUP_DIR
sudo mkdir -p $VOLUME_PATH/logs

# Backup de la base de datos
print_status "💾 Creando backup de la base de datos..."
BACKUP_FILE="$BACKUP_DIR/database_$(date +%Y%m%d_%H%M%S).sqlite"
sudo cp $PROJECT_DIR/backend/database/database.sqlite $BACKUP_FILE
log "Backup creado: $BACKUP_FILE"

# Limpiar backups antiguos (mantener solo los últimos 10)
print_status "🧹 Limpiando backups antiguos..."
cd $BACKUP_DIR
sudo ls -t database_*.sqlite | tail -n +11 | sudo xargs -r rm
log "Backups antiguos eliminados"

# Limpiar logs de Laravel antiguos
print_status "📝 Limpiando logs antiguos..."
sudo find $PROJECT_DIR/backend/storage/logs/ -name "*.log" -mtime +30 -delete
log "Logs antiguos eliminados"

# Limpiar cache de Laravel
print_status "🗑️ Limpiando cache de Laravel..."
cd $PROJECT_DIR/backend
php artisan cache:clear
php artisan view:clear
php artisan route:cache
php artisan config:cache
log "Cache de Laravel limpiado"

# Optimizar base de datos SQLite
print_status "⚡ Optimizando base de datos..."
sqlite3 $PROJECT_DIR/backend/database/database.sqlite "VACUUM; ANALYZE;"
log "Base de datos optimizada"

# Verificar estado de servicios
print_status "🔍 Verificando estado de servicios..."

# Verificar servicio de Laravel
if sudo systemctl is-active --quiet inexcons-backend; then
    print_success "✅ Servicio Laravel activo"
    log "Servicio Laravel activo"
else
    print_warning "⚠️ Servicio Laravel inactivo, reiniciando..."
    sudo systemctl restart inexcons-backend
    log "Servicio Laravel reiniciado"
fi

# Verificar PM2
if pm2 describe inexcons-frontend > /dev/null 2>&1; then
    print_success "✅ Frontend PM2 activo"
    log "Frontend PM2 activo"
else
    print_warning "⚠️ Frontend PM2 inactivo, reiniciando..."
    cd $PROJECT_DIR/frontend
    pm2 restart inexcons-frontend
    log "Frontend PM2 reiniciado"
fi

# Verificar Nginx
if sudo systemctl is-active --quiet nginx; then
    print_success "✅ Nginx activo"
    log "Nginx activo"
else
    print_warning "⚠️ Nginx inactivo, reiniciando..."
    sudo systemctl restart nginx
    log "Nginx reiniciado"
fi

# Verificar espacio en volumen
print_status "💽 Verificando espacio en volumen..."
VOLUME_USAGE=$(df $VOLUME_PATH | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $VOLUME_USAGE -gt 80 ]; then
    print_warning "⚠️ Espacio en volumen bajo: ${VOLUME_USAGE}%"
    log "Advertencia: Espacio en volumen bajo: ${VOLUME_USAGE}%"
else
    print_success "✅ Espacio en volumen OK: ${VOLUME_USAGE}%"
    log "Espacio en volumen OK: ${VOLUME_USAGE}%"
fi

# Verificar memoria
print_status "🧠 Verificando uso de memoria..."
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 80 ]; then
    print_warning "⚠️ Uso de memoria alto: ${MEMORY_USAGE}%"
    log "Advertencia: Uso de memoria alto: ${MEMORY_USAGE}%"
else
    print_success "✅ Uso de memoria OK: ${MEMORY_USAGE}%"
    log "Uso de memoria OK: ${MEMORY_USAGE}%"
fi

# Actualizar sistema (solo paquetes de seguridad)
print_status "🔒 Actualizando paquetes de seguridad..."
sudo apt update
sudo apt upgrade -y --with-new-pkgs -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"
sudo apt autoremove -y
sudo apt autoclean
log "Sistema actualizado"

# Generar reporte de estado
print_status "📊 Generando reporte de estado..."
REPORT_FILE="/tmp/inexcons-status-$(date +%Y%m%d_%H%M%S).txt"

cat > $REPORT_FILE << EOF
REPORTE DE ESTADO DE INEXCONS
$(date)

=== SERVICIOS ===
Laravel Backend: $(sudo systemctl is-active inexcons-backend)
Frontend PM2: $(pm2 describe inexcons-frontend > /dev/null 2>&1 && echo "active" || echo "inactive")
Nginx: $(sudo systemctl is-active nginx)

=== SISTEMA ===
Uso de disco: ${DISK_USAGE}%
Uso de memoria: ${MEMORY_USAGE}%
Uptime: $(uptime -p)

=== BASE DE DATOS ===
Tamaño de BD: $(du -h $PROJECT_DIR/backend/database/database.sqlite | cut -f1)
Último backup: $(ls -t $BACKUP_DIR/database_*.sqlite 2>/dev/null | head -1 | xargs -r basename)

=== LOGS RECIENTES ===
Últimas 5 líneas del log de Laravel:
$(tail -5 $PROJECT_DIR/backend/storage/logs/laravel.log 2>/dev/null || echo "No hay logs recientes")

Últimas 5 líneas del log de Nginx:
$(sudo tail -5 /var/log/nginx/inexcons_access.log 2>/dev/null || echo "No hay logs recientes")
EOF

echo "📋 Reporte guardado en: $REPORT_FILE"
log "Reporte generado: $REPORT_FILE"

print_success "🎉 Mantenimiento completado exitosamente!"
print_status "💾 Información del volumen:"
df -h $VOLUME_PATH
log "Mantenimiento completado"

# Mostrar resumen
echo ""
echo "📋 RESUMEN DEL MANTENIMIENTO:"
echo "  • Backup creado: $(basename $BACKUP_FILE)"
echo "  • Espacio en disco: ${DISK_USAGE}%"
echo "  • Uso de memoria: ${MEMORY_USAGE}%"
echo "  • Servicios verificados y activos"
echo "  • Sistema actualizado"
echo "  • Reporte: $REPORT_FILE"
