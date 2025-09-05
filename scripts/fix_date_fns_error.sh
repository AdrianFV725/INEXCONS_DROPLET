#!/bin/bash

# Script para corregir errores de date-fns con MUI X Date Pickers
# Uso: bash scripts/fix_date_fns_error.sh

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
    print_status "Esperado: directorio que contiene 'frontend/package.json'"
    exit 1
fi

print_status "🔧 Corrigiendo errores de date-fns con MUI X Date Pickers..."

cd frontend

# 1. Mostrar versiones actuales
print_status "📊 Verificando versiones actuales..."
echo "date-fns actual: $(npm list date-fns --depth=0 2>/dev/null | grep date-fns || echo 'No instalado')"
echo "@mui/x-date-pickers actual: $(npm list @mui/x-date-pickers --depth=0 2>/dev/null | grep @mui/x-date-pickers || echo 'No instalado')"

# 2. Crear backup del package.json
print_status "💾 Creando backup de package.json..."
cp package.json package.json.backup.$(date +%Y%m%d_%H%M%S)

# 3. Desinstalar versiones problemáticas
print_status "🗑️ Removiendo versiones problemáticas..."
npm uninstall date-fns @mui/x-date-pickers @mui/x-date-pickers-pro 2>/dev/null || true

# 4. Limpiar caché de npm
print_status "🧹 Limpiando caché de npm..."
npm cache clean --force

# 5. Instalar versiones compatibles
print_status "📦 Instalando versiones compatibles..."

# Instalar date-fns v2.x (compatible con MUI)
npm install date-fns@^2.30.0

# Instalar MUI X Date Pickers compatible
npm install @mui/x-date-pickers@^6.19.0

# 6. Verificar e instalar dependencias adicionales si son necesarias
print_status "🔍 Verificando dependencias adicionales..."

# Verificar si MUI Core está instalado
if ! npm list @mui/material --depth=0 >/dev/null 2>&1; then
    print_status "Instalando @mui/material..."
    npm install @mui/material@^5.15.0
fi

# Verificar si @emotion está instalado (requerido por MUI)
if ! npm list @emotion/react --depth=0 >/dev/null 2>&1; then
    print_status "Instalando @emotion/react y @emotion/styled..."
    npm install @emotion/react@^11.11.0 @emotion/styled@^11.11.0
fi

# 7. Actualizar imports en el código si es necesario
print_status "🔧 Verificando imports en el código..."

# Buscar archivos que usen date-fns
DATEFNS_FILES=$(find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | xargs grep -l "date-fns" 2>/dev/null || true)

if [ -n "$DATEFNS_FILES" ]; then
    print_warning "⚠️ Archivos que usan date-fns encontrados:"
    echo "$DATEFNS_FILES" | sed 's/^/  • /'
    echo ""
    print_status "Verificando imports..."
    
    # Crear script de corrección de imports
    cat > fix_imports.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Función para corregir imports de date-fns
function fixDateFnsImports(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Cambiar imports individuales por import principal
    const imports = [
        'addDays', 'addSeconds', 'addMinutes', 'addHours', 'addWeeks', 'addMonths', 'addYears',
        'endOfDay', 'endOfWeek', 'endOfYear', 'endOfMonth',
        'format', 'getDate', 'getDaysInMonth', 'getHours', 'getMinutes', 'getMonth',
        'getSeconds', 'getMilliseconds', 'getWeek', 'getYear',
        'isAfter', 'isBefore', 'isEqual', 'isSameDay', 'isSameYear', 'isSameMonth', 'isSameHour', 'isValid',
        'parse', 'setDate', 'setHours', 'setMinutes', 'setMonth', 'setSeconds', 'setMilliseconds', 'setYear',
        'startOfDay', 'startOfMonth', 'startOfWeek', 'startOfYear', 'isWithinInterval'
    ];
    
    // Buscar y reemplazar imports problemáticos
    imports.forEach(func => {
        const oldImport = new RegExp(`import\\s*{\\s*${func}\\s*}\\s*from\\s*['"]date-fns/${func}['"]`, 'g');
        if (content.match(oldImport)) {
            content = content.replace(oldImport, `import { ${func} } from 'date-fns'`);
            modified = true;
        }
    });
    
    // Manejar imports múltiples en una línea
    const multiImportRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]date-fns\/[^'"]+['"]/g;
    content = content.replace(multiImportRegex, (match, functions) => {
        modified = true;
        return `import { ${functions.trim()} } from 'date-fns'`;
    });
    
    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Corregido: ${filePath}`);
        return true;
    }
    return false;
}

// Procesar archivos
const args = process.argv.slice(2);
let totalFixed = 0;

args.forEach(file => {
    if (fs.existsSync(file)) {
        if (fixDateFnsImports(file)) {
            totalFixed++;
        }
    }
});

console.log(`\n📊 Total de archivos corregidos: ${totalFixed}`);
EOF

    # Ejecutar corrección de imports si Node.js está disponible
    if command -v node >/dev/null 2>&1; then
        echo "$DATEFNS_FILES" | xargs node fix_imports.js
        rm -f fix_imports.js
    else
        print_warning "Node.js no disponible para corrección automática de imports"
    fi
fi

# 8. Reinstalar todas las dependencias
print_status "🔄 Reinstalando todas las dependencias..."
rm -rf node_modules package-lock.json
npm install

# 9. Verificar versiones finales
print_status "📊 Verificando versiones finales..."
echo ""
echo "Versiones instaladas:"
echo "  • date-fns: $(npm list date-fns --depth=0 2>/dev/null | grep date-fns | awk '{print $2}' || echo 'Error')"
echo "  • @mui/x-date-pickers: $(npm list @mui/x-date-pickers --depth=0 2>/dev/null | grep @mui/x-date-pickers | awk '{print $2}' || echo 'Error')"

# 10. Intentar build de prueba
print_status "🧪 Ejecutando build de prueba..."
if timeout 30s npm run build 2>/dev/null; then
    print_success "✅ Build de prueba exitoso"
else
    print_warning "⚠️ Build de prueba falló o tardó demasiado"
fi

print_success "🎉 Corrección de date-fns completada"

echo ""
echo "📋 Próximos pasos:"
echo "  1. Verificar que la aplicación inicia: npm run dev"
echo "  2. Si hay errores adicionales, revisar los imports manualmente"
echo "  3. Considerar usar otro adaptador de fechas como @mui/x-date-pickers/AdapterDayjs"
