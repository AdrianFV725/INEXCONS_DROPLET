#!/bin/bash

# Script para corregir instalación PHP en Ubuntu 24.10 y verificar servicios

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

PROJECT_DIR="/opt/inexcons"

print_status "🔧 Corrigiendo instalación PHP en Ubuntu 24.10..."

# Limpiar repositorios problemáticos
print_status "🧹 Limpiando repositorios problemáticos..."
sudo rm -f /etc/apt/sources.list.d/ondrej-*.list
sudo rm -f /etc/apt/sources.list.d/ondrej-*.sources

# Detectar versión de Ubuntu
UBUNTU_VERSION=$(lsb_release -rs)
print_status "Versión detectada: Ubuntu $UBUNTU_VERSION"

# Para Ubuntu 24.10, usar repositorio de Noble (24.04)
if [[ "$UBUNTU_VERSION" == "24.10" ]]; then
    print_warning "Ubuntu 24.10 detectado. Configurando repositorio compatible..."
    
    # Crear directorio para claves
    sudo mkdir -p /etc/apt/keyrings
    
    # Descargar clave GPG
    print_status "Descargando clave GPG..."
    curl -fsSL https://packages.sury.org/php/apt.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/ondrej-php.gpg
    
    # Crear archivo de repositorio usando Noble
    sudo tee /etc/apt/sources.list.d/ondrej-php.sources > /dev/null << EOF
Types: deb
URIs: http://ppa.launchpad.net/ondrej/php/ubuntu
Suites: noble
Components: main
Signed-By: /etc/apt/keyrings/ondrej-php.gpg
EOF
    
    print_success "✅ Repositorio configurado para usar Noble"
else
    # Para otras versiones, usar método normal
    sudo add-apt-repository ppa:ondrej/php -y
fi

# Actualizar lista de paquetes
print_status "📦 Actualizando lista de paquetes..."
sudo apt update

# Instalar PHP 8.2
print_status "🐘 Instalando PHP 8.2..."
sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml \
    php8.2-curl php8.2-zip php8.2-intl php8.2-bcmath php8.2-gd php8.2-sqlite3 php8.2-cli

# Verificar instalación
if php8.2 --version > /dev/null 2>&1; then
    print_success "✅ PHP 8.2 instalado correctamente"
    php8.2 --version | head -1
else
    print_error "❌ Error instalando PHP 8.2"
    exit 1
fi

# Instalar Composer si no existe
if ! command -v composer >/dev/null 2>&1; then
    print_status "🎼 Instalando Composer..."
    php8.2 -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
    php8.2 composer-setup.php
    sudo mv composer.phar /usr/local/bin/composer
    sudo chmod +x /usr/local/bin/composer
    rm -f composer-setup.php
    print_success "✅ Composer instalado"
else
    print_success "✅ Composer ya está instalado"
    composer --version
fi

# Instalar Node.js si no existe
if ! command -v node >/dev/null 2>&1; then
    print_status "🟢 Instalando Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "✅ Node.js instalado"
else
    print_success "✅ Node.js ya está instalado"
    node --version
    npm --version
fi

# Verificar si el proyecto ya existe
if [ -d "$PROJECT_DIR" ]; then
    print_status "📁 Proyecto encontrado en $PROJECT_DIR"
    
    # Continuar configuración del backend
    print_status "⚙️ Configurando backend Laravel..."
    cd $PROJECT_DIR/backend
    
    # Instalar dependencias
    composer install --no-dev --optimize-autoloader
    
    # Configurar .env si no existe
    if [ ! -f .env ]; then
        print_status "📝 Creando archivo .env..."
        cat > .env << EOF
APP_NAME=INEXCONS
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://167.172.114.3

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=sqlite
DB_DATABASE=$PROJECT_DIR/backend/database/database.sqlite

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120
EOF
    fi
    
    # Generar clave
    php8.2 artisan key:generate --force
    
    # Crear base de datos
    touch database/database.sqlite
    
    # Ejecutar migraciones
    php8.2 artisan migrate --force
    
    # Configurar permisos
    sudo chown -R www-data:www-data storage bootstrap/cache
    sudo chmod -R 775 storage bootstrap/cache
    
    # Configurar frontend
    print_status "⚛️ Configurando frontend..."
    cd $PROJECT_DIR/frontend
    
    # Instalar dependencias
    npm install
    
    # Construir para producción
    npm run build
    
    # Configurar servicios systemd
    print_status "🔧 Configurando servicios systemd..."
    
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
ExecStart=/usr/bin/php8.2 artisan serve --host=0.0.0.0 --port=8000
Restart=always
RestartSec=5

Environment=APP_ENV=production

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
Restart=always
RestartSec=5

Environment=NODE_ENV=production
Environment=PORT=5173

StandardOutput=journal
StandardError=journal
SyslogIdentifier=inexcons-frontend

[Install]
WantedBy=multi-user.target
EOF

    # Configurar Nginx
    print_status "🌐 Configurando Nginx..."
    sudo tee /etc/nginx/sites-available/inexcons << EOF
server {
    listen 80;
    server_name 167.172.114.3 _;
    root $PROJECT_DIR/frontend/dist;
    index index.html;

    access_log /var/log/nginx/inexcons_access.log;
    error_log /var/log/nginx/inexcons_error.log;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /storage/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Habilitar sitio
    sudo ln -sf /etc/nginx/sites-available/inexcons /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Validar configuración
    sudo nginx -t
    
    # Recargar systemd
    sudo systemctl daemon-reload
    
    # Iniciar servicios
    print_status "🚀 Iniciando servicios..."
    sudo systemctl enable inexcons-backend inexcons-frontend nginx
    sudo systemctl start inexcons-backend inexcons-frontend
    sudo systemctl restart nginx
    
else
    print_error "❌ Proyecto no encontrado en $PROJECT_DIR"
    print_status "Ejecuta primero el script deploy-complete.sh desde el directorio del proyecto"
    exit 1
fi

# Verificar servicios
print_status "🔍 Verificando servicios..."
sleep 3

echo "=== ESTADO DE SERVICIOS ==="
sudo systemctl status inexcons-backend --no-pager
echo ""
sudo systemctl status inexcons-frontend --no-pager  
echo ""
sudo systemctl status nginx --no-pager

echo ""
echo "=== PUERTOS EN USO ==="
sudo netstat -tulpn | grep -E ":(80|8000|5173)"

print_success "🎉 Configuración completada!"
print_status "Tu aplicación debería estar disponible en: http://167.172.114.3"
