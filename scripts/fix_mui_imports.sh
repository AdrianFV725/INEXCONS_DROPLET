#!/bin/bash

# Script para corregir imports de MUI X Date Pickers en el código
# Uso: bash scripts/fix_mui_imports.sh

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

# Verificar que estamos en el directorio correcto
if [ ! -f "frontend/package.json" ]; then
    print_error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    print_status "Directorio actual: $(pwd)"
    exit 1
fi

print_status "🔧 Corrigiendo imports de MUI X Date Pickers..."

cd frontend

# 1. Encontrar archivos que usan AdapterDateFns
print_status "🔍 Buscando archivos con imports problemáticos..."

FILES_TO_FIX=$(find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | xargs grep -l "AdapterDateFns" 2>/dev/null || true)

if [ -z "$FILES_TO_FIX" ]; then
    print_success "✅ No se encontraron archivos que requieran corrección"
    exit 0
fi

print_status "📁 Archivos que requieren corrección:"
echo "$FILES_TO_FIX" | sed 's/^/  • /'

# 2. Hacer backup de archivos
print_status "💾 Creando backups..."
for file in $FILES_TO_FIX; do
    cp "$file" "$file.backup.$(date +%Y%m%d_%H%M%S)"
done

# 3. Corregir imports en cada archivo
print_status "🔄 Corrigiendo imports..."

for file in $FILES_TO_FIX; do
    print_status "Corrigiendo: $file"
    
    # Cambiar AdapterDateFns por AdapterDayjs
    sed -i 's|@mui/x-date-pickers/AdapterDateFns|@mui/x-date-pickers/AdapterDayjs|g' "$file"
    sed -i 's|AdapterDateFns|AdapterDayjs|g' "$file"
    
    # También corregir cualquier referencia a date-fns locale
    sed -i 's|date-fns/locale|dayjs/locale|g' "$file" || true
    
    print_success "  ✅ $file corregido"
done

# 4. Instalar dependencias correctas
print_status "📦 Instalando dependencias correctas..."

# Desinstalar date-fns y su adaptador
npm uninstall date-fns @mui/x-date-pickers 2>/dev/null || true

# Instalar dayjs y MUI con versiones compatibles
npm install dayjs @mui/x-date-pickers@^6.19.0

# Verificar que las dependencias se instalaron correctamente
if npm list dayjs @mui/x-date-pickers >/dev/null 2>&1; then
    print_success "✅ Dependencias instaladas correctamente"
else
    print_warning "⚠️ Algunas dependencias podrían no haberse instalado correctamente"
fi

# 5. Limpiar node_modules y reinstalar
print_status "🧹 Limpiando y reinstalando todas las dependencias..."
rm -rf node_modules package-lock.json
npm install

# 6. Mostrar resumen de cambios
print_status "📊 Resumen de cambios:"
echo "  • Archivos corregidos: $(echo "$FILES_TO_FIX" | wc -l)"
echo "  • AdapterDateFns → AdapterDayjs"
echo "  • date-fns → dayjs"
echo "  • Dependencias actualizadas"

# 7. Crear ejemplo de uso correcto
print_status "📝 Ejemplo de uso correcto:"
cat << 'EOF'

// ✅ Import correcto:
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

// ✅ Uso correcto:
<LocalizationProvider dateAdapter={AdapterDayjs}>
  <DatePicker
    label="Fecha"
    value={dayjs(value)}
    onChange={(newValue) => setValue(newValue)}
  />
</LocalizationProvider>

EOF

print_success "🎉 Corrección de imports completada"
print_status "Ahora puedes ejecutar: npm run dev"

# 8. Verificar que el build funciona
print_status "🧪 Verificando que no hay errores de sintaxis..."
if timeout 15s npm run build 2>/dev/null >/dev/null; then
    print_success "✅ Build exitoso - no hay errores de sintaxis"
else
    print_warning "⚠️ Build falló o tardó demasiado - revisa manualmente si hay errores"
fi
