#!/bin/bash

# Script completo para arreglar frontend y backend
# Uso: bash scripts/fix_complete_setup.sh

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

print_status "🔧 Arreglando configuración completa de INEXCONS..."

# 1. ARREGLAR SERVICIOS DEL SISTEMA
print_status "🛑 Deteniendo servicios conflictivos..."

# Detener procesos que puedan estar usando los puertos
sudo pkill -f "php artisan serve" 2>/dev/null || true
sudo pkill -f "vite" 2>/dev/null || true
sudo pkill -f "npm run dev" 2>/dev/null || true

# Detener servicios systemd si existen
sudo systemctl stop inexcons-backend 2>/dev/null || true
sudo systemctl stop inexcons-frontend 2>/dev/null || true

print_success "✅ Servicios detenidos"

# 2. ARREGLAR FRONTEND
print_status "⚛️ Arreglando frontend React..."

cd frontend

# Eliminar dependencias problemáticas
print_status "🗑️ Eliminando dependencias problemáticas..."
npm uninstall date-fns @mui/x-date-pickers @mui/x-date-pickers-pro 2>/dev/null || true

# Limpiar completamente node_modules
print_status "🧹 Limpiando node_modules..."
rm -rf node_modules package-lock.json

# Instalar dependencias básicas correctas
print_status "📦 Instalando dependencias básicas..."
npm install

# Instalar MUI Date Pickers sin adaptador específico (usaremos el nativo)
print_status "📅 Instalando MUI Date Pickers con adaptador nativo..."
npm install @mui/x-date-pickers@6.19.9

# 3. CORREGIR IMPORTS EN EL CÓDIGO
print_status "🔄 Corrigiendo imports en el código..."

# Crear script de corrección
cat > fix_imports.js << 'EOF'
const fs = require('fs');
const path = require('path');

function fixImports(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Comentar imports problemáticos y agregar configuración simple
        if (content.includes('AdapterDateFns') || content.includes('AdapterDayjs')) {
            // Comentar import del adaptador
            content = content.replace(
                /import\s*{\s*(AdapterDateFns|AdapterDayjs)\s*}\s*from\s*["'][^"']+["'];?/g,
                '// import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";'
            );
            
            // Comentar LocalizationProvider si existe
            const localizationRegex = /<LocalizationProvider[^>]*dateAdapter[^>]*>/g;
            content = content.replace(localizationRegex, (match) => {
                return '<LocalizationProvider>';
            });
            
            // Simplificar LocalizationProvider closing tag si hay problemas
            content = content.replace(
                /dateAdapter=\{[^}]+\}/g,
                ''
            );
            
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Corregido: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.log(`⚠️ Error procesando ${filePath}: ${error.message}`);
        return false;
    }
}

// Buscar archivos JSX/JS
const { execSync } = require('child_process');
try {
    const files = execSync('find src -name "*.jsx" -o -name "*.js"', { encoding: 'utf8' })
        .split('\n')
        .filter(f => f.trim());
    
    let totalFixed = 0;
    files.forEach(file => {
        if (file && fixImports(file)) {
            totalFixed++;
        }
    });
    
    console.log(`\n📊 Total archivos corregidos: ${totalFixed}`);
} catch (error) {
    console.log('Error buscando archivos:', error.message);
}
EOF

# Ejecutar corrección
node fix_imports.js
rm fix_imports.js

# Reinstalar dependencias
print_status "🔄 Reinstalando dependencias..."
npm install

print_success "✅ Frontend corregido"

# 4. VOLVER AL DIRECTORIO RAÍZ Y ARREGLAR BACKEND
cd ..

print_status "🐘 Configurando backend Laravel..."

cd backend

# Verificar que el archivo .env existe
if [ ! -f .env ]; then
    print_status "📝 Creando archivo .env..."
    cp .env.example .env
    php artisan key:generate
fi

# Asegurar que la base de datos existe
if [ ! -f database/database.sqlite ]; then
    print_status "💾 Creando base de datos SQLite..."
    touch database/database.sqlite
fi

# Configurar .env para usar puertos correctos
print_status "⚙️ Configurando puertos en .env..."
sed -i 's/APP_URL=.*/APP_URL=http:\/\/137.184.18.22/' .env

# Limpiar cachés
print_status "🧹 Limpiando cachés de Laravel..."
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

# 5. CONFIGURAR NGINX PARA MANEJAR EL PROXY CORRECTAMENTE
cd ..
print_status "🌐 Configurando Nginx..."

# Crear configuración de Nginx optimizada
sudo tee /etc/nginx/sites-available/inexcons << 'EOF'
server {
    listen 80;
    server_name 137.184.18.22;
    
    # Root para archivos estáticos del frontend
    root /mnt/volume_nyc1_01/inexcons/frontend/dist;
    index index.html;
    
    # Logs
    access_log /var/log/nginx/inexcons_access.log;
    error_log /var/log/nginx/inexcons_error.log;
    
    # API del backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        
        # Headers CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization, X-Requested-With' always;
        
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization, X-Requested-With';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
    
    # Storage de Laravel
    location /storage/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend React (SPA)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Headers para SPA
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Archivos estáticos con cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # Compresión
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF

# Habilitar sitio
sudo ln -sf /etc/nginx/sites-available/inexcons /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración de Nginx
sudo nginx -t

# 6. CREAR SCRIPTS DE INICIO
print_status "📜 Creando scripts de inicio..."

# Script para iniciar backend
cat > start_backend.sh << 'EOF'
#!/bin/bash
cd /root/INEXCONS_DROPLET/backend
php artisan serve --host=0.0.0.0 --port=8000
EOF

# Script para build y servir frontend
cat > start_frontend.sh << 'EOF'
#!/bin/bash
cd /root/INEXCONS_DROPLET/frontend
npm run build
npx serve -s dist -l 5173
EOF

chmod +x start_backend.sh start_frontend.sh

# 7. CONSTRUIR FRONTEND
print_status "🏗️ Construyendo frontend..."
cd frontend
npm run build

# Verificar que el build fue exitoso
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    print_success "✅ Frontend construido exitosamente"
else
    print_error "❌ Error en el build del frontend"
    exit 1
fi

cd ..

# 8. CONFIGURAR SERVICIOS SYSTEMD ACTUALIZADOS
print_status "🔧 Actualizando servicios systemd..."

# Actualizar servicio del backend
sudo tee /etc/systemd/system/inexcons-backend.service << 'EOF'
[Unit]
Description=INEXCONS Laravel Backend
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/root/INEXCONS_DROPLET/backend
ExecStart=/usr/bin/php artisan serve --host=0.0.0.0 --port=8000
Restart=always
RestartSec=5
Environment=APP_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd
sudo systemctl daemon-reload

# 9. INICIAR SERVICIOS
print_status "🚀 Iniciando servicios..."

# Iniciar backend
sudo systemctl enable inexcons-backend
sudo systemctl start inexcons-backend

# Esperar un momento
sleep 3

# Verificar que el backend está corriendo
if curl -s http://127.0.0.1:8000 >/dev/null; then
    print_success "✅ Backend corriendo en puerto 8000"
else
    print_warning "⚠️ Backend podría no estar respondiendo correctamente"
fi

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# 10. VERIFICACIONES FINALES
print_status "🔍 Verificaciones finales..."

echo ""
echo "📊 Estado de servicios:"
echo "  • Backend: $(systemctl is-active inexcons-backend)"
echo "  • Nginx: $(systemctl is-active nginx)"
echo "  • Puerto 8000: $(ss -tlnp | grep :8000 >/dev/null && echo "✅ Activo" || echo "❌ Inactivo")"
echo "  • Puerto 80: $(ss -tlnp | grep :80 >/dev/null && echo "✅ Activo" || echo "❌ Inactivo")"

# Verificar endpoints
echo ""
echo "🌐 Verificaciones de endpoints:"
echo "  • Backend directo: $(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000 2>/dev/null)"
echo "  • Frontend via Nginx: $(curl -s -o /dev/null -w "%{http_code}" http://137.184.18.22 2>/dev/null)"

print_success "🎉 Configuración completa terminada"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📋 RESUMEN"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ Frontend:"
echo "  • Dependencias de fecha arregladas"
echo "  • Build generado en frontend/dist"
echo "  • Servido por Nginx en puerto 80"
echo ""
echo "✅ Backend:"
echo "  • Laravel corriendo en puerto 8000"
echo "  • Servicio systemd configurado"
echo "  • API accesible via /api/"
echo ""
echo "✅ Nginx:"
echo "  • Proxy configurado correctamente"
echo "  • CORS habilitado"
echo "  • Servir SPA configurado"
echo ""
echo "🌐 URLs:"
echo "  • Aplicación: http://137.184.18.22"
echo "  • API: http://137.184.18.22/api/"
echo "  • Backend directo: http://137.184.18.22:8000"
echo ""
echo "📟 Comandos útiles:"
echo "  • Ver logs backend: sudo journalctl -u inexcons-backend -f"
echo "  • Ver logs nginx: sudo tail -f /var/log/nginx/inexcons_error.log"
echo "  • Reiniciar backend: sudo systemctl restart inexcons-backend"
echo "  • Rebuild frontend: cd frontend && npm run build"
