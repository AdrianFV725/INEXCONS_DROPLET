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

# Verificar e instalar PHP
print_status "🐘 Verificando instalación de PHP..."

# Verificar si PHP ya está instalado
if command -v php >/dev/null 2>&1; then
    PHP_VERSION=$(php --version | head -1 | cut -d' ' -f2 | cut -d'.' -f1,2)
    print_success "✅ PHP $PHP_VERSION ya está instalado"
    php --version | head -1
    
    # Verificar que sea una versión compatible (8.1+)
    if [[ $(echo "$PHP_VERSION >= 8.1" | bc 2>/dev/null || echo "0") == "1" ]] || [[ "$PHP_VERSION" =~ ^8\.[1-9] ]]; then
        print_success "✅ Versión de PHP compatible detectada"
        PHP_CMD="php"
        
        # Verificar extensiones necesarias
        print_status "🔍 Verificando extensiones de PHP..."
        MISSING_EXTENSIONS=()
        
        for ext in curl gd intl mbstring mysql sqlite3 xml zip bcmath; do
            if ! php -m | grep -qi "^$ext$"; then
                MISSING_EXTENSIONS+=("$ext")
            fi
        done
        
        if [ ${#MISSING_EXTENSIONS[@]} -gt 0 ]; then
            print_warning "⚠️ Faltan algunas extensiones: ${MISSING_EXTENSIONS[*]}"
            print_status "Intentando instalar extensiones faltantes..."
            
            # Intentar instalar extensiones para PHP 8.3
            for ext in "${MISSING_EXTENSIONS[@]}"; do
                sudo apt install -y "php8.3-$ext" 2>/dev/null || sudo apt install -y "php-$ext" 2>/dev/null || true
            done
        else
            print_success "✅ Todas las extensiones necesarias están instaladas"
        fi
        
        SKIP_PHP_INSTALL=true
    else
        print_warning "⚠️ Versión de PHP antigua detectada ($PHP_VERSION). Se instalará PHP 8.2"
        SKIP_PHP_INSTALL=false
    fi
else
    print_status "PHP no está instalado. Procediendo con instalación de PHP 8.2..."
    SKIP_PHP_INSTALL=false
fi

if [ "$SKIP_PHP_INSTALL" = false ]; then
    # Verificar la versión de Ubuntu
    UBUNTU_VERSION=$(lsb_release -rs)
    print_status "Versión de Ubuntu detectada: $UBUNTU_VERSION"

    # Limpiar repositorios problemáticos primero
    print_status "🧹 Limpiando repositorios problemáticos..."
    sudo rm -f /etc/apt/sources.list.d/ondrej-ubuntu-php-oracular.sources
    sudo rm -f /etc/apt/sources.list.d/ondrej-php.list

if [[ "$UBUNTU_VERSION" == "24.10" ]]; then
    print_warning "Ubuntu 24.10 (Oracular) detectado. Usando repositorio de Ondrej con Noble..."
    
    # Crear directorio para claves si no existe
    sudo mkdir -p /etc/apt/keyrings
    
    # Configurar repositorio de Ondrej usando Noble (Ubuntu 24.04)
    print_status "Configurando repositorio de Ondrej para Noble..."
    
    # Crear el archivo de repositorio moderno
    sudo tee /etc/apt/sources.list.d/ondrej-php.sources > /dev/null << EOF
Types: deb
URIs: http://ppa.launchpad.net/ondrej/php/ubuntu
Suites: noble
Components: main
Signed-By: /etc/apt/keyrings/ondrej-php.gpg
EOF
    
    # Método alternativo para obtener la clave GPG
    print_status "Descargando clave GPG de Ondrej..."
    
    # Intentar múltiples métodos para obtener la clave
    if ! curl -fsSL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x4f4ea0aae5267a6c" | sudo gpg --dearmor -o /etc/apt/keyrings/ondrej-php.gpg 2>/dev/null; then
        print_status "Método 1 falló, intentando método 2..."
        if ! wget -qO- "https://packages.sury.org/php/apt.gpg" | sudo gpg --dearmor -o /etc/apt/keyrings/ondrej-php.gpg 2>/dev/null; then
            print_status "Método 2 falló, intentando método 3..."
            sudo gpg --keyserver keyserver.ubuntu.com --recv-keys 4F4EA0AAE5267A6C
            sudo gpg --export 4F4EA0AAE5267A6C | sudo gpg --dearmor -o /etc/apt/keyrings/ondrej-php.gpg
        fi
    fi
    
    # Verificar que la clave se instaló
    if [ ! -f /etc/apt/keyrings/ondrej-php.gpg ]; then
        print_error "No se pudo instalar la clave GPG"
        exit 1
    fi
    
    print_status "Actualizando lista de paquetes..."
    sudo apt update
    
    print_status "Instalando PHP 8.2 desde repositorio de Ondrej..."
    sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-intl php8.2-bcmath php8.2-gd php8.2-sqlite3
else
    # Para otras versiones, usar el método normal
    sudo add-apt-repository ppa:ondrej/php -y
    sudo apt update
    sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-intl php8.2-bcmath php8.2-gd php8.2-sqlite3
    fi

    # Verificar instalación de PHP
    if php8.2 --version > /dev/null 2>&1; then
        print_success "✅ PHP 8.2 instalado correctamente"
        php8.2 --version | head -1
        PHP_CMD="php8.2"
    else
        print_error "❌ Error instalando PHP 8.2"
        exit 1
    fi
else
    print_success "✅ Usando PHP existente en el sistema"
fi

# Configurar comando PHP a usar
if [ -z "$PHP_CMD" ]; then
    PHP_CMD="php"
fi

print_status "🔧 Comando PHP a usar: $PHP_CMD"

# Instalar Composer
print_status "🎼 Instalando Composer..."
$PHP_CMD -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
$PHP_CMD composer-setup.php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer
rm -f composer-setup.php

# Instalar Node.js 18
print_status "🟢 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 no es necesario - usaremos systemd para gestión de servicios
print_status "ℹ️ Usaremos systemd para gestión de servicios en lugar de PM2"

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
$PHP_CMD artisan key:generate

# Crear base de datos SQLite
touch database/database.sqlite

# Ejecutar migraciones
$PHP_CMD artisan migrate --force

# Optimizar Laravel para producción
$PHP_CMD artisan config:cache
$PHP_CMD artisan route:cache
$PHP_CMD artisan view:cache

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

# Crear archivos de servicio systemd
print_status "🔧 Creando servicios systemd..."

# Copiar archivos de servicio
sudo cp $PROJECT_DIR/services/inexcons-backend.service /etc/systemd/system/
sudo cp $PROJECT_DIR/services/inexcons-frontend.service /etc/systemd/system/

# Actualizar las rutas y comando PHP en los archivos de servicio
sudo sed -i "s|/mnt/volume_nyc1_01/inexcons|$PROJECT_DIR|g" /etc/systemd/system/inexcons-backend.service
sudo sed -i "s|/mnt/volume_nyc1_01/inexcons|$PROJECT_DIR|g" /etc/systemd/system/inexcons-frontend.service
sudo sed -i "s|/usr/bin/php|$(which $PHP_CMD)|g" /etc/systemd/system/inexcons-backend.service

# Establecer permisos correctos
sudo chmod 644 /etc/systemd/system/inexcons-backend.service
sudo chmod 644 /etc/systemd/system/inexcons-frontend.service

# Configurar package.json para preview del frontend
print_status "🔧 Configurando scripts de producción para React..."
cd $PROJECT_DIR/frontend

# Asegurar que el script preview esté configurado correctamente
npm pkg set scripts.preview="vite preview --host 0.0.0.0 --port $FRONTEND_PORT"

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

# Recargar configuración de systemd
sudo systemctl daemon-reload

# Habilitar y iniciar servicio de Laravel
sudo systemctl enable inexcons-backend
sudo systemctl start inexcons-backend

# Habilitar y iniciar servicio de React
sudo systemctl enable inexcons-frontend
sudo systemctl start inexcons-frontend

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Verificar que los servicios estén funcionando
sleep 5
print_status "🔍 Verificando estado de servicios..."
if systemctl is-active --quiet inexcons-backend; then
    print_success "✅ Backend service está activo"
else
    print_error "❌ Backend service falló al iniciar"
    sudo journalctl -u inexcons-backend --no-pager -l
fi

if systemctl is-active --quiet inexcons-frontend; then
    print_success "✅ Frontend service está activo"
else
    print_error "❌ Frontend service falló al iniciar"
    sudo journalctl -u inexcons-frontend --no-pager -l
fi

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
\$(which php) artisan migrate --force
\$(which php) artisan config:cache
\$(which php) artisan route:cache
\$(which php) artisan view:cache

# Actualizar frontend
cd \$PROJECT_DIR/frontend
npm install
npm run build

# Reiniciar servicios
sudo systemctl restart inexcons-backend
sudo systemctl restart inexcons-frontend
sudo systemctl reload nginx

echo "✅ Actualización completada!"
EOF

chmod +x $PROJECT_DIR/update.sh

# Hacer ejecutables los scripts de administración
print_status "🔧 Configurando scripts de administración..."
chmod +x $PROJECT_DIR/inexcons-control.sh
chmod +x $PROJECT_DIR/maintenance.sh

# Crear enlaces simbólicos para fácil acceso
print_status "🔗 Creando enlaces simbólicos..."
sudo ln -sf $PROJECT_DIR/update.sh /usr/local/bin/inexcons-update
sudo ln -sf $PROJECT_DIR/inexcons-control.sh /usr/local/bin/inexcons-control
sudo ln -sf $PROJECT_DIR/maintenance.sh /usr/local/bin/inexcons-maintenance

# Mostrar estado de servicios
print_status "📊 Estado de los servicios:"
echo "Backend (Laravel):"
sudo systemctl status inexcons-backend --no-pager -l
echo -e "\nFrontend (React):"
sudo systemctl status inexcons-frontend --no-pager -l
echo -e "\nNginx:"
sudo systemctl status nginx --no-pager -l

# Mostrar información del volumen
print_status "💾 Información del volumen utilizado:"
df -h $VOLUME_PATH

print_success "🎉 ¡Despliegue completado exitosamente!"
print_success "🌐 Tu aplicación está disponible en: http://$DROPLET_IP"
print_success "📁 Proyecto instalado en: $PROJECT_DIR"
print_success "💾 Usando volumen: $VOLUME_PATH"
print_success "🔄 Comandos rápidos disponibles:"
echo "  • inexcons-update     - Actualizar aplicación"
echo "  • inexcons-control    - Controlar servicios"
echo "  • inexcons-maintenance - Mantenimiento del sistema"

print_status "📋 Información del despliegue:"
echo "  • Frontend: Servido por Nginx en puerto 80"
echo "  • Backend: Laravel en puerto $BACKEND_PORT"
echo "  • Base de datos: SQLite en $PROJECT_DIR/backend/database/database.sqlite"
echo "  • Backups: $VOLUME_PATH/backups/inexcons/"
echo "  • Logs de Nginx: /var/log/nginx/${PROJECT_NAME}_*.log"
echo "  • Logs de Laravel: $PROJECT_DIR/backend/storage/logs/"
echo ""
echo "📟 Comandos útiles para administración:"
echo "  • Ver logs del backend: sudo journalctl -u inexcons-backend -f"
echo "  • Ver logs del frontend: sudo journalctl -u inexcons-frontend -f"
echo "  • Reiniciar backend: sudo systemctl restart inexcons-backend"
echo "  • Reiniciar frontend: sudo systemctl restart inexcons-frontend"
echo "  • Estado de servicios: sudo systemctl status inexcons-backend inexcons-frontend nginx"
echo "  • Habilitar servicios: sudo systemctl enable inexcons-backend inexcons-frontend"
echo "  • Deshabilitar servicios: sudo systemctl disable inexcons-backend inexcons-frontend"

print_warning "🔒 Recuerda:"
echo "  • Cambiar las credenciales por defecto"
echo "  • Configurar SSL/TLS para producción"
echo "  • Hacer backups regulares de la base de datos"

print_success "✅ INEXCONS está listo para usar en tu droplet!"
