#!/bin/bash

# Script de despliegue completo para INEXCONS en Droplet DigitalOcean
# IP del droplet: 167.172.114.3
# Instala todas las dependencias y configura servicios systemd

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

# Variables de configuración
DROPLET_IP="167.172.114.3"
PROJECT_NAME="inexcons"
PROJECT_DIR="/opt/$PROJECT_NAME"
BACKEND_PORT="8000"
FRONTEND_PORT="5173"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

print_status "🚀 Iniciando despliegue completo de INEXCONS en droplet $DROPLET_IP"

# Verificar que somos root o podemos usar sudo
if [[ $EUID -ne 0 && ! $(sudo -l 2>/dev/null | grep -q NOPASSWD) ]]; then
    print_error "Este script necesita permisos de administrador"
    exit 1
fi

# Actualizar sistema
print_status "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependencias básicas del sistema
print_status "🔧 Instalando dependencias del sistema..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https \
    lsb-release ca-certificates zip nginx ufw sqlite3 bc

# Instalar PHP 8.2
print_status "🐘 Instalando PHP 8.2..."
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml \
    php8.2-curl php8.2-zip php8.2-intl php8.2-bcmath php8.2-gd php8.2-sqlite3 php8.2-cli

# Verificar instalación de PHP
if php8.2 --version > /dev/null 2>&1; then
    print_success "✅ PHP 8.2 instalado correctamente"
    php8.2 --version | head -1
    PHP_CMD="php8.2"
else
    print_error "❌ Error instalando PHP 8.2"
    exit 1
fi

# Instalar Composer
print_status "🎼 Instalando Composer..."
$PHP_CMD -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
$PHP_CMD composer-setup.php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer
rm -f composer-setup.php

# Verificar Composer
composer --version

# Instalar Node.js 18
print_status "🟢 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar Node.js y npm
node --version
npm --version

# Crear directorio del proyecto
print_status "📁 Creando directorio del proyecto..."
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# Si el script se ejecuta desde el directorio del proyecto, copiar archivos
if [[ -f "backend/composer.json" && -f "frontend/package.json" ]]; then
    print_status "📋 Copiando archivos del proyecto..."
    cp -r . $PROJECT_DIR/
else
    print_error "❌ El script debe ejecutarse desde el directorio raíz del proyecto INEXCONS"
    print_status "Asegúrate de que existan los directorios 'backend' y 'frontend'"
    exit 1
fi

cd $PROJECT_DIR

# Configurar backend Laravel
print_status "⚙️ Configurando backend Laravel..."
cd $PROJECT_DIR/backend

# Instalar dependencias de PHP
composer install --no-dev --optimize-autoloader

# Crear archivo .env
if [ ! -f .env ]; then
    print_status "📝 Creando archivo .env para Laravel..."
    cat > .env << EOF
APP_NAME=INEXCONS
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://$DROPLET_IP

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=sqlite
DB_DATABASE=$PROJECT_DIR/backend/database/database.sqlite

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="\${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_APP_NAME="\${APP_NAME}"
VITE_PUSHER_APP_KEY="\${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="\${PUSHER_HOST}"
VITE_PUSHER_PORT="\${PUSHER_PORT}"
VITE_PUSHER_SCHEME="\${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="\${PUSHER_APP_CLUSTER}"
EOF
fi

# Generar clave de aplicación
$PHP_CMD artisan key:generate

# Crear base de datos SQLite
touch database/database.sqlite

# Ejecutar migraciones
$PHP_CMD artisan migrate --force

# Configurar permisos de Laravel
sudo chown -R www-data:www-data $PROJECT_DIR/backend/storage $PROJECT_DIR/backend/bootstrap/cache
sudo chmod -R 775 $PROJECT_DIR/backend/storage $PROJECT_DIR/backend/bootstrap/cache

# Configurar frontend React
print_status "⚛️ Configurando frontend React..."
cd $PROJECT_DIR/frontend

# Instalar dependencias
npm install

# Configurar Vite para producción
cat > vite.config.js << EOF
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: $FRONTEND_PORT,
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

# Construir el frontend
npm run build

# Crear archivos de servicio systemd
print_status "🔧 Creando servicios systemd..."

# Servicio backend
sudo tee /etc/systemd/system/inexcons-backend.service > /dev/null << EOF
[Unit]
Description=INEXCONS Laravel Backend Service
After=network.target
Wants=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_DIR/backend
ExecStart=$PHP_CMD artisan serve --host=0.0.0.0 --port=$BACKEND_PORT
ExecReload=/bin/kill -HUP \$MAINPID
KillMode=mixed
Restart=always
RestartSec=5
TimeoutStopSec=30

# Environment variables
Environment=PHP_CLI_SERVER_WORKERS=4
Environment=APP_ENV=production

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PROJECT_DIR/backend/storage
ReadWritePaths=$PROJECT_DIR/backend/bootstrap/cache
ReadWritePaths=$PROJECT_DIR/backend/database

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=inexcons-backend

[Install]
WantedBy=multi-user.target
EOF

# Servicio frontend
sudo tee /etc/systemd/system/inexcons-frontend.service > /dev/null << EOF
[Unit]
Description=INEXCONS React Frontend Service
After=network.target inexcons-backend.service
Wants=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_DIR/frontend
ExecStart=/usr/bin/npm run preview
ExecReload=/bin/kill -HUP \$MAINPID
KillMode=mixed
Restart=always
RestartSec=5
TimeoutStopSec=30

# Environment variables
Environment=NODE_ENV=production
Environment=PORT=$FRONTEND_PORT

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=inexcons-frontend

[Install]
WantedBy=multi-user.target
EOF

# Configurar script preview para frontend
cd $PROJECT_DIR/frontend
npm pkg set scripts.preview="vite preview --host 0.0.0.0 --port $FRONTEND_PORT"

# Configurar Nginx
print_status "🌐 Configurando Nginx..."
sudo tee $NGINX_AVAILABLE/$PROJECT_NAME << EOF
server {
    listen 80;
    server_name $DROPLET_IP _;
    root $PROJECT_DIR/frontend/dist;
    index index.html;

    # Logs
    access_log /var/log/nginx/${PROJECT_NAME}_access.log;
    error_log /var/log/nginx/${PROJECT_NAME}_error.log;

    # Servir archivos estáticos del frontend
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
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

# Configurar firewall
print_status "🔥 Configurando firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Recargar systemd y iniciar servicios
print_status "🚀 Iniciando servicios..."
sudo systemctl daemon-reload

# Habilitar y iniciar servicios
sudo systemctl enable inexcons-backend
sudo systemctl start inexcons-backend

sudo systemctl enable inexcons-frontend  
sudo systemctl start inexcons-frontend

sudo systemctl restart nginx
sudo systemctl enable nginx

# Verificar servicios
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

if systemctl is-active --quiet nginx; then
    print_success "✅ Nginx está activo"
else
    print_error "❌ Nginx falló al iniciar"
fi

# Crear script de control rápido
print_status "📝 Creando scripts de administración..."
cat > $PROJECT_DIR/control.sh << EOF
#!/bin/bash

case "\$1" in
    start)
        sudo systemctl start inexcons-backend inexcons-frontend nginx
        echo "Servicios iniciados"
        ;;
    stop)
        sudo systemctl stop inexcons-backend inexcons-frontend
        echo "Servicios detenidos"
        ;;
    restart)
        sudo systemctl restart inexcons-backend inexcons-frontend nginx
        echo "Servicios reiniciados"
        ;;
    status)
        sudo systemctl status inexcons-backend inexcons-frontend nginx
        ;;
    logs)
        case "\$2" in
            backend)
                sudo journalctl -u inexcons-backend -f
                ;;
            frontend)
                sudo journalctl -u inexcons-frontend -f
                ;;
            nginx)
                sudo journalctl -u nginx -f
                ;;
            *)
                echo "Uso: \$0 logs [backend|frontend|nginx]"
                ;;
        esac
        ;;
    *)
        echo "Uso: \$0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
EOF

chmod +x $PROJECT_DIR/control.sh
sudo ln -sf $PROJECT_DIR/control.sh /usr/local/bin/inexcons

# Mostrar información final
print_success "🎉 ¡Despliegue completado exitosamente!"
print_success "🌐 Tu aplicación está disponible en: http://$DROPLET_IP"
print_success "📁 Proyecto instalado en: $PROJECT_DIR"

print_status "📋 Información del despliegue:"
echo "  • Frontend: Servido por Nginx en puerto 80"
echo "  • Backend: Laravel en puerto $BACKEND_PORT"
echo "  • Base de datos: SQLite en $PROJECT_DIR/backend/database/database.sqlite"
echo ""
echo "📟 Comandos útiles para administración:"
echo "  • inexcons start     - Iniciar servicios"
echo "  • inexcons stop      - Detener servicios"
echo "  • inexcons restart   - Reiniciar servicios"
echo "  • inexcons status    - Ver estado de servicios"
echo "  • inexcons logs backend   - Ver logs del backend"
echo "  • inexcons logs frontend  - Ver logs del frontend"
echo "  • inexcons logs nginx     - Ver logs de nginx"

print_warning "🔒 Recomendaciones de seguridad:"
echo "  • Cambiar las credenciales por defecto"
echo "  • Configurar SSL/TLS para producción"
echo "  • Hacer backups regulares de la base de datos"

print_success "✅ INEXCONS está listo para usar en tu droplet!"
