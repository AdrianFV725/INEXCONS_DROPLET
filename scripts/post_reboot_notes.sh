#!/bin/bash

# Script para detectar kernel pendiente y recomendar reboot
# Uso: bash scripts/post_reboot_notes.sh

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

print_status "🔍 Verificando estado del sistema y kernel..."

# 1. Verificar kernel activo vs instalado
print_status "Verificando versiones de kernel..."

CURRENT_KERNEL=$(uname -r)
INSTALLED_KERNELS=$(dpkg -l | grep linux-image | grep -v "linux-image-generic" | awk '{print $2}' | sed 's/linux-image-//' | sort -V)
LATEST_INSTALLED=$(echo "$INSTALLED_KERNELS" | tail -1)

echo ""
echo "📊 Estado del kernel:"
echo "  • Kernel activo: $CURRENT_KERNEL"
echo "  • Último instalado: $LATEST_INSTALLED"

if [ "$CURRENT_KERNEL" != "$LATEST_INSTALLED" ]; then
    print_warning "⚠️ REBOOT RECOMENDADO"
    echo ""
    echo "🔄 Motivos para reiniciar:"
    echo "  • Kernel desactualizado (activo: $CURRENT_KERNEL vs instalado: $LATEST_INSTALLED)"
    echo "  • Actualizaciones de seguridad del kernel pendientes"
    echo "  • Optimizaciones y correcciones del sistema"
    echo ""
    echo "📋 Para reiniciar:"
    echo "  sudo reboot"
    echo ""
    REBOOT_NEEDED=true
else
    print_success "✅ Kernel actualizado (no se requiere reboot)"
    REBOOT_NEEDED=false
fi

# 2. Verificar paquetes que requieren reboot
print_status "Verificando paquetes que requieren reboot..."

REBOOT_REQUIRED_PKGS=""
if [ -f /var/run/reboot-required.pkgs ]; then
    REBOOT_REQUIRED_PKGS=$(cat /var/run/reboot-required.pkgs)
    print_warning "⚠️ Paquetes que requieren reboot detectados:"
    echo "$REBOOT_REQUIRED_PKGS" | sed 's/^/  • /'
    REBOOT_NEEDED=true
elif [ -f /var/run/reboot-required ]; then
    print_warning "⚠️ Reboot requerido por el sistema"
    REBOOT_NEEDED=true
fi

# 3. Verificar servicios que requieren reinicio
print_status "Verificando servicios que requieren reinicio..."

SERVICES_NEED_RESTART=""
if command -v needrestart >/dev/null 2>&1; then
    # Si needrestart está disponible
    SERVICES_NEED_RESTART=$(needrestart -p -r l 2>/dev/null | grep "NEEDRESTART-SVC:" | cut -d: -f2 | sort -u)
    if [ -n "$SERVICES_NEED_RESTART" ]; then
        print_warning "⚠️ Servicios que requieren reinicio:"
        echo "$SERVICES_NEED_RESTART" | sed 's/^/  • /'
        echo ""
        echo "📋 Para reiniciar servicios:"
        echo "$SERVICES_NEED_RESTART" | while read service; do
            echo "  sudo systemctl restart $service"
        done
    else
        print_success "✅ No hay servicios que requieran reinicio"
    fi
else
    # Verificación manual básica
    if [ -f /var/run/reboot-required ]; then
        print_warning "⚠️ Sistema requiere reboot (instala 'needrestart' para más detalles)"
    fi
fi

# 4. Verificar actualizaciones pendientes
print_status "Verificando actualizaciones pendientes..."

# Actualizar cache silenciosamente
apt-get update >/dev/null 2>&1 || true

UPDATES_AVAILABLE=$(apt list --upgradable 2>/dev/null | grep -c upgradable || echo "0")
if [ "$UPDATES_AVAILABLE" -gt 0 ]; then
    print_warning "⚠️ $UPDATES_AVAILABLE actualizaciones disponibles"
    echo ""
    echo "📋 Para actualizar:"
    echo "  sudo apt update && sudo apt upgrade -y"
else
    print_success "✅ Sistema actualizado"
fi

# 5. Verificar estado de dpkg
print_status "Verificando integridad de paquetes..."

BROKEN_PACKAGES=$(dpkg -l | grep -E "^..[^i]" | wc -l)
if [ "$BROKEN_PACKAGES" -gt 0 ]; then
    print_warning "⚠️ $BROKEN_PACKAGES paquetes en estado inconsistente"
    echo ""
    echo "📋 Para reparar:"
    echo "  sudo dpkg --configure -a"
    echo "  sudo apt-get -f install"
else
    print_success "✅ Paquetes en estado consistente"
fi

# 6. Verificar espacio en disco
print_status "Verificando espacio en disco..."

DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    print_warning "⚠️ Espacio en disco bajo: ${DISK_USAGE}%"
    echo ""
    echo "📋 Para liberar espacio:"
    echo "  sudo apt autoremove -y"
    echo "  sudo apt autoclean"
    echo "  sudo journalctl --vacuum-time=7d"
else
    print_success "✅ Espacio en disco adecuado: ${DISK_USAGE}%"
fi

# 7. Resumen y recomendaciones
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📋 RESUMEN DEL ESTADO DEL SISTEMA"
echo "═══════════════════════════════════════════════════════════════"

if [ "$REBOOT_NEEDED" = true ]; then
    print_warning "🔄 REBOOT RECOMENDADO"
    echo ""
    echo "Motivos:"
    [ "$CURRENT_KERNEL" != "$LATEST_INSTALLED" ] && echo "  • Kernel desactualizado"
    [ -f /var/run/reboot-required ] && echo "  • Sistema requiere reboot"
    [ -n "$REBOOT_REQUIRED_PKGS" ] && echo "  • Paquetes requieren reboot"
    echo ""
    echo "🚀 Comando para reiniciar:"
    echo "  sudo reboot"
    echo ""
    print_status "⏰ Programa el reboot en una ventana de mantenimiento adecuada"
else
    print_success "✅ Sistema estable - No se requiere reboot inmediato"
fi

# 8. Checklist post-deploy
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ CHECKLIST POST-DEPLOY"
echo "═══════════════════════════════════════════════════════════════"

echo ""
echo "🔧 Comandos de verificación del sistema:"
echo "  dpkg --configure -a              # Configurar paquetes pendientes"
echo "  apt-get -f install               # Reparar dependencias rotas"
echo "  apt update && apt upgrade -y     # Actualizar sistema"
echo ""
echo "📊 Verificación de herramientas:"
echo "  php -v                          # Verificar PHP"
echo "  node -v                         # Verificar Node.js"
echo "  nginx -v                        # Verificar Nginx"
echo "  composer --version              # Verificar Composer"
echo ""
echo "🐘 Verificación de Laravel:"
echo "  cd /mnt/volume_nyc1_01/inexcons/backend"
echo "  php artisan migrate:status      # Estado de migraciones"
echo "  php artisan config:cache        # Regenerar cache"
echo ""
echo "🔧 Verificación de servicios:"
echo "  systemctl status inexcons-backend inexcons-frontend nginx"
echo "  journalctl -u inexcons-backend --since '1 hour ago'"
echo ""
echo "🌐 Verificación web:"
echo "  curl -I http://137.184.18.22    # Verificar respuesta HTTP"
echo "  curl http://137.184.18.22/api/health || echo 'API endpoint no disponible'"

# 9. Crear script de post-reboot
cat > /tmp/post_reboot_checklist.sh << 'EOF'
#!/bin/bash
echo "🔄 Verificación post-reboot..."
echo "Kernel actual: $(uname -r)"
echo "Uptime: $(uptime)"
echo ""
echo "Verificando servicios INEXCONS..."
systemctl status inexcons-backend inexcons-frontend nginx
echo ""
echo "Verificando aplicación..."
curl -I http://137.184.18.22 || echo "Aplicación no responde"
EOF

chmod +x /tmp/post_reboot_checklist.sh

if [ "$REBOOT_NEEDED" = true ]; then
    echo ""
    print_status "📝 Script de verificación post-reboot creado: /tmp/post_reboot_checklist.sh"
    echo "Ejecuta este script después del reboot para verificar que todo funcione correctamente"
fi

echo ""
print_success "🎉 Verificación del sistema completada"

