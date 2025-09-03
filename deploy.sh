#!/bin/bash

# Script de despliegue para INEXCONS en Droplet de DigitalOcean
# IP del droplet: 137.184.18.22

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
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

# Variables de configuración - USANDO EL VOLUMEN CON MÁS ESPACIO
DROPLET_IP="137.184.18.22"
PROJECT_NAME="inexcons"
VOLUME_PATH="/mnt/volume_nyc1_01"
PROJECT_DIR="$VOLUME_PATH/$PROJECT_NAME"
BACKEND_PORT="8000"
FRONTEND_PORT="5173"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

print_status "🚀 Iniciando despliegue de INEXCONS en droplet $DROPLET_IP"
print_status "📁 Instalando en volumen: $VOLUME_PATH (mayor espacio disponible)"

# Verificar que el volumen esté montado
if [ ! -d "$VOLUME_PATH" ]; then
    print_error "❌ El volumen $VOLUME_PATH no está disponible"
    print_status "Volúmenes disponibles:"
    df -h
    exit 1
fi

# Mostrar espacio disponible
print_status "💾 Espacio disponible en volúmenes:"
df -h | grep -E "(Filesystem|/dev/|tmpfs.*run$)"

# Verificar permisos en el volumen
print_status "🔐 Configurando permisos en el volumen..."
sudo chown -R root:root $VOLUME_PATH
sudo chmod 755 $VOLUME_PATH

# Actualizar sistema
print_status "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependencias del sistema
print_status "🔧 Instalando dependencias del sistema..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https lsb-release ca-certificates

# Instalar PHP 8.2
print_status "🐘 Instalando PHP 8.2..."
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-intl php8.2-bcmath php8.2-gd php8.2-sqlite3

# Instalar Composer
print_status "🎼 Instalando Composer..."
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer

# Instalar Node.js 18
print_status "🟢 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 para manejar procesos Node.js
print_status "⚡ Instalando PM2..."
sudo npm install -g pm2

# Instalar Nginx
print_status "🌐 Instalando Nginx..."
sudo apt install -y nginx

# Crear directorio del proyecto en el volumen
print_status "📁 Creando directorio del proyecto en $PROJECT_DIR..."
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# Copiar archivos del proyecto (asumiendo que el script se ejecuta desde el directorio del proyecto)
print_status "📋 Copiando archivos del proyecto..."
cp -r . $PROJECT_DIR/
cd $PROJECT_DIR

# Configurar backend Laravel
print_status "⚙️ Configurando backend Laravel..."
cd $PROJECT_DIR/backend

# Instalar dependencias de PHP
composer install --no-dev --optimize-autoloader

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    print_status "📝 Creando archivo .env para Laravel..."
    cp .env.example .env
    
    # Configurar variables de entorno
    sed -i "s/APP_ENV=local/APP_ENV=production/" .env
    sed -i "s/APP_DEBUG=true/APP_DEBUG=false/" .env
    sed -i "s|APP_URL=http://localhost|APP_URL=http://$DROPLET_IP|" .env
    
    # Configurar base de datos SQLite
    sed -i "s/DB_CONNECTION=mysql/DB_CONNECTION=sqlite/" .env
    sed -i "s|DB_DATABASE=laravel|DB_DATABASE=$PROJECT_DIR/backend/database/database.sqlite|" .env
    
    # Comentar variables de MySQL no necesarias
    sed -i "s/DB_HOST=/#DB_HOST=/" .env
    sed -i "s/DB_PORT=/#DB_PORT=/" .env
    sed -i "s/DB_USERNAME=/#DB_USERNAME=/" .env
    sed -i "s/DB_PASSWORD=/#DB_PASSWORD=/" .env
fi

# Generar clave de aplicación
php artisan key:generate

# Crear base de datos SQLite
touch database/database.sqlite

# Ejecutar migraciones
php artisan migrate --force

# Optimizar Laravel para producción
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Configurar permisos
sudo chown -R www-data:www-data $PROJECT_DIR/backend/storage $PROJECT_DIR/backend/bootstrap/cache
sudo chmod -R 775 $PROJECT_DIR/backend/storage $PROJECT_DIR/backend/bootstrap/cache

# Configurar frontend React
print_status "⚛️ Configurando frontend React..."
cd $PROJECT_DIR/frontend

# Instalar dependencias
npm install

# Actualizar configuración de Vite para producción
cat > vite.config.js << EOF
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: $FRONTEND_PORT,
    proxy: {
      '/api': {
        target: 'http://localhost:$BACKEND_PORT',
        changeOrigin: true,
      },
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: true,
  },
  base: '/',
  preview: {
    host: '0.0.0.0',
    port: $FRONTEND_PORT
  }
})
EOF

# Actualizar configuración de axios para producción
cat > src/utils/axiosConfig.js << 'EOF'
import axios from 'axios';

const instance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true,
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  }
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.params = {
      ...config.params,
      _t: new Date().getTime()
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const currentPath = window.location.pathname;
      const isAuthRoute = ['/login', '/forgot-password', '/reset-password'].includes(currentPath);
      
      if (!isAuthRoute) {
        setTimeout(() => {
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }, 100);
      }
    } else if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('La conexión tardó demasiado. Por favor, verifica tu conexión a internet.'));
    } else if (!error.response) {
      return Promise.reject(new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.'));
    } else if (error.response?.status === 422) {
      return Promise.reject(new Error('Datos inválidos. Por favor, verifica la información ingresada.'));
    } else if (error.response?.status === 500) {
      return Promise.reject(new Error('Error del servidor. Por favor, intenta más tarde.'));
    }
    return Promise.reject(error);
  }
);

export default instance;
EOF

# Construir el frontend para producción
npm run build

# Crear archivo de servicio systemd para Laravel
print_status "🔧 Creando servicio systemd para Laravel..."
sudo tee /etc/systemd/system/inexcons-backend.service > /dev/null << EOF
[Unit]
Description=INEXCONS Laravel Backend
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_DIR/backend
ExecStart=/usr/bin/php artisan serve --host=0.0.0.0 --port=$BACKEND_PORT
Restart=always
RestartSec=3
Environment=PHP_CLI_SERVER_WORKERS=4

[Install]
WantedBy=multi-user.target
EOF

# Crear configuración de PM2 para el frontend
print_status "🔧 Creando configuración PM2 para React..."
cat > $PROJECT_DIR/frontend/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'inexcons-frontend',
    cwd: '$PROJECT_DIR/frontend',
    script: 'npm',
    args: 'run preview',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $FRONTEND_PORT
    }
  }]
};
EOF

# Configurar Nginx
print_status "🌐 Configurando Nginx..."
sudo tee $NGINX_AVAILABLE/$PROJECT_NAME << EOF
server {
    listen 80;
    server_name $DROPLET_IP;
    root $PROJECT_DIR/frontend/dist;
    index index.html;

    # Logs
    access_log /var/log/nginx/${PROJECT_NAME}_access.log;
    error_log /var/log/nginx/${PROJECT_NAME}_error.log;

    # Servir archivos estáticos del frontend
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Proxy para API del backend
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Configuración para archivos de storage de Laravel
    location /storage/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Optimización para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compresión
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
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

# Habilitar sitio en Nginx
sudo ln -sf $NGINX_AVAILABLE/$PROJECT_NAME $NGINX_ENABLED/
sudo rm -f $NGINX_ENABLED/default

# Validar configuración de Nginx
sudo nginx -t

# Iniciar y habilitar servicios
print_status "🚀 Iniciando servicios..."

# Habilitar y iniciar servicio de Laravel
sudo systemctl daemon-reload
sudo systemctl enable inexcons-backend
sudo systemctl start inexcons-backend

# Iniciar frontend con PM2
cd $PROJECT_DIR/frontend
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Configurar firewall
print_status "🔥 Configurando firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Crear script de actualización
print_status "📝 Creando script de actualización..."
cat > $PROJECT_DIR/update.sh << EOF
#!/bin/bash

PROJECT_DIR="$PROJECT_DIR"
BACKUP_DIR="$VOLUME_PATH/backups/inexcons"

echo "🔄 Actualizando INEXCONS..."

# Crear backup
echo "💾 Creando backup..."
sudo mkdir -p \$BACKUP_DIR
sudo cp \$PROJECT_DIR/backend/database/database.sqlite \$BACKUP_DIR/database_\$(date +%Y%m%d_%H%M%S).sqlite

# Actualizar código
cd \$PROJECT_DIR
git pull origin main

# Actualizar backend
cd \$PROJECT_DIR/backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Actualizar frontend
cd \$PROJECT_DIR/frontend
npm install
npm run build

# Reiniciar servicios
sudo systemctl restart inexcons-backend
pm2 restart inexcons-frontend
sudo systemctl reload nginx

echo "✅ Actualización completada!"
EOF

chmod +x $PROJECT_DIR/update.sh

# Crear enlaces simbólicos para fácil acceso
print_status "🔗 Creando enlaces simbólicos..."
sudo ln -sf $PROJECT_DIR/update.sh /usr/local/bin/inexcons-update

# Mostrar estado de servicios
print_status "📊 Estado de los servicios:"
sudo systemctl status inexcons-backend --no-pager -l
pm2 status
sudo systemctl status nginx --no-pager -l

# Mostrar información del volumen
print_status "💾 Información del volumen utilizado:"
df -h $VOLUME_PATH

print_success "🎉 ¡Despliegue completado exitosamente!"
print_success "🌐 Tu aplicación está disponible en: http://$DROPLET_IP"
print_success "📁 Proyecto instalado en: $PROJECT_DIR"
print_success "💾 Usando volumen: $VOLUME_PATH"
print_success "🔄 Comando rápido de actualización: inexcons-update"

print_status "📋 Información del despliegue:"
echo "  • Frontend: Servido por Nginx en puerto 80"
echo "  • Backend: Laravel en puerto $BACKEND_PORT"
echo "  • Base de datos: SQLite en $PROJECT_DIR/backend/database/database.sqlite"
echo "  • Backups: $VOLUME_PATH/backups/inexcons/"
echo "  • Logs de Nginx: /var/log/nginx/${PROJECT_NAME}_*.log"
echo "  • Logs de Laravel: $PROJECT_DIR/backend/storage/logs/"
echo "  • Comando para ver logs del backend: sudo journalctl -u inexcons-backend -f"
echo "  • Comando para ver logs del frontend: pm2 logs inexcons-frontend"

print_warning "🔒 Recuerda:"
echo "  • Cambiar las credenciales por defecto"
echo "  • Configurar SSL/TLS para producción"
echo "  • Hacer backups regulares de la base de datos"

print_success "✅ INEXCONS está listo para usar en tu droplet!"
