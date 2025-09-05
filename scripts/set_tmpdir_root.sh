#!/bin/bash

# Script para configurar TMPDIR=/tmp para root y Cursor
# Uso: sudo bash scripts/set_tmpdir_root.sh

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

print_status "🔧 Configurando TMPDIR para root y Cursor..."

# 1. Configurar TMPDIR en /root/.profile
print_status "Configurando TMPDIR en /root/.profile..."

# Crear backup si existe
if [ -f /root/.profile ]; then
    cp /root/.profile /root/.profile.backup.$(date +%Y%m%d_%H%M%S)
fi

# Eliminar configuraciones previas de TMPDIR
sed -i '/export TMPDIR/d' /root/.profile 2>/dev/null || true

# Agregar configuración de TMPDIR
cat >> /root/.profile << 'EOF'

# Configuración TMPDIR para Cursor y herramientas
export TMPDIR=/tmp
EOF

print_success "✅ TMPDIR configurado en /root/.profile"

# 2. Configurar Cursor remote environment
print_status "Configurando entorno remoto de Cursor..."

# Crear archivo de entorno para Cursor
cat > /root/.cursor-remote-env.sh << 'EOF'
#!/bin/bash
# Configuración de entorno para Cursor Remote

# Forzar TMPDIR a /tmp
export TMPDIR=/tmp

# Otras variables de entorno útiles
export TERM=xterm-256color
export LC_ALL=C.UTF-8
export LANG=C.UTF-8

# Verificar que /tmp esté disponible y escribible
if [ ! -d "$TMPDIR" ] || [ ! -w "$TMPDIR" ]; then
    echo "Warning: TMPDIR=$TMPDIR no está disponible o no es escribible"
    export TMPDIR=/tmp
fi

# Debug: mostrar variables relevantes
if [ "${DEBUG_CURSOR:-}" = "1" ]; then
    echo "TMPDIR=$TMPDIR"
    echo "PWD=$PWD"
    echo "USER=$USER"
fi
EOF

chmod +x /root/.cursor-remote-env.sh
print_success "✅ Archivo /root/.cursor-remote-env.sh creado"

# 3. Cargar entorno Cursor desde .profile
print_status "Integrando configuración Cursor en .profile..."

# Eliminar referencias previas
sed -i '/cursor-remote-env/d' /root/.profile 2>/dev/null || true

# Agregar carga del entorno Cursor
cat >> /root/.profile << 'EOF'

# Cargar configuración de entorno para Cursor
if [ -f /root/.cursor-remote-env.sh ]; then
    source /root/.cursor-remote-env.sh
fi
EOF

print_success "✅ Configuración Cursor integrada en .profile"

# 4. Crear directorio .cursor-server con permisos correctos
print_status "Configurando directorio .cursor-server..."

# Crear directorio si no existe
mkdir -p /root/.cursor-server

# Establecer permisos correctos (700 = rwx------)
chmod 700 /root/.cursor-server

# Verificar permisos
PERMS=$(stat -c "%a" /root/.cursor-server)
if [ "$PERMS" = "700" ]; then
    print_success "✅ Directorio /root/.cursor-server con permisos 700"
else
    print_warning "⚠️ Permisos del directorio: $PERMS (esperado: 700)"
fi

# 5. Configurar TMPDIR para la sesión actual
print_status "Aplicando configuración a la sesión actual..."

export TMPDIR=/tmp

# Verificar que funcione
if [ "$TMPDIR" = "/tmp" ]; then
    print_success "✅ TMPDIR configurado para sesión actual: $TMPDIR"
else
    print_warning "⚠️ TMPDIR no se configuró correctamente: $TMPDIR"
fi

# 6. Crear script de verificación
print_status "Creando script de verificación..."

cat > /root/check_tmpdir.sh << 'EOF'
#!/bin/bash
echo "=== Verificación de configuración TMPDIR ==="
echo "TMPDIR actual: ${TMPDIR:-no configurado}"
echo "Directorio /tmp disponible: $([ -d /tmp ] && echo "✅ Sí" || echo "❌ No")"
echo "Directorio /tmp escribible: $([ -w /tmp ] && echo "✅ Sí" || echo "❌ No")"
echo "Permisos .cursor-server: $(stat -c "%a" /root/.cursor-server 2>/dev/null || echo "no existe")"
echo ""
echo "Archivos de configuración:"
echo "  /root/.profile: $([ -f /root/.profile ] && echo "✅ Existe" || echo "❌ No existe")"
echo "  /root/.cursor-remote-env.sh: $([ -f /root/.cursor-remote-env.sh ] && echo "✅ Existe" || echo "❌ No existe")"
echo ""
echo "Contenido TMPDIR en .profile:"
grep -n "TMPDIR" /root/.profile 2>/dev/null || echo "  No encontrado"
echo ""
echo "Test de escritura en TMPDIR:"
if echo "test" > "${TMPDIR:-/tmp}/cursor_test_$$" 2>/dev/null; then
    rm -f "${TMPDIR:-/tmp}/cursor_test_$$"
    echo "  ✅ Escritura exitosa"
else
    echo "  ❌ Error de escritura"
fi
EOF

chmod +x /root/check_tmpdir.sh
print_success "✅ Script de verificación creado: /root/check_tmpdir.sh"

# 7. Mostrar resumen
print_status "Verificando configuración..."

echo ""
echo "📊 Resumen de configuración:"
echo "  • TMPDIR en .profile: $(grep -c "export TMPDIR" /root/.profile)"
echo "  • Archivo Cursor env: $([ -f /root/.cursor-remote-env.sh ] && echo "✅ Creado" || echo "❌ Error")"
echo "  • Directorio .cursor-server: $([ -d /root/.cursor-server ] && echo "✅ Creado" || echo "❌ Error")"
echo "  • Permisos correctos: $([ "$(stat -c "%a" /root/.cursor-server)" = "700" ] && echo "✅ 700" || echo "❌ Incorrecto")"
echo "  • TMPDIR actual: ${TMPDIR:-no configurado}"

print_success "🎉 Configuración TMPDIR completada"
print_status "Ejecuta 'source /root/.profile' o reinicia la sesión para aplicar cambios"
print_status "Usa '/root/check_tmpdir.sh' para verificar la configuración en cualquier momento"

