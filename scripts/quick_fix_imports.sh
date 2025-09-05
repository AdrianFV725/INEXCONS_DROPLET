#!/bin/bash

# Solución rápida para corregir imports MUI
# Uso: bash scripts/quick_fix_imports.sh

print_status() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
print_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }

print_status "🚀 Corrección rápida de imports MUI..."

cd frontend

# 1. Instalar dependencias correctas
print_status "📦 Instalando dayjs..."
npm uninstall date-fns @mui/x-date-pickers 2>/dev/null || true
npm install dayjs @mui/x-date-pickers@6.19.9

# 2. Corregir imports automáticamente
print_status "🔄 Corrigiendo imports..."

# Buscar y reemplazar en todos los archivos JSX/JS
find src -name "*.jsx" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" | while read file; do
    if grep -q "AdapterDateFns" "$file" 2>/dev/null; then
        echo "Corrigiendo: $file"
        
        # Crear backup
        cp "$file" "$file.bak"
        
        # Reemplazar imports
        sed -i 's|@mui/x-date-pickers/AdapterDateFns|@mui/x-date-pickers/AdapterDayjs|g' "$file"
        sed -i 's|AdapterDateFns|AdapterDayjs|g' "$file"
        
        echo "  ✅ $file corregido"
    fi
done

# 3. Limpiar y reinstalar
print_status "🧹 Reinstalando dependencias..."
rm -rf node_modules package-lock.json
npm install

print_success "🎉 Corrección completada!"
print_status "Ejecuta: npm run dev"
