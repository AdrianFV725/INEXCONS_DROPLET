#!/bin/bash

# Solución rápida para el error de date-fns
# Uso: bash scripts/quick_fix_date_fns.sh

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

print_status "🚀 Solución rápida para error de date-fns..."

cd frontend

# Método 1: Instalar versiones específicas compatibles
print_status "📦 Instalando versiones compatibles..."

npm uninstall date-fns @mui/x-date-pickers 2>/dev/null || true

# Instalar versiones específicas que funcionan juntas
npm install date-fns@2.30.0 @mui/x-date-pickers@6.19.9

print_success "✅ Paquetes reinstalados"

# Método 2: Limpiar y reinstalar
print_status "🧹 Limpiando node_modules..."
rm -rf node_modules package-lock.json
npm install

print_success "🎉 Corrección rápida completada"
print_status "Ahora ejecuta: npm run dev"
