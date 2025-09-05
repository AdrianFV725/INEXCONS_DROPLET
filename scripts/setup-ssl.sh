#!/bin/bash

# Script para configurar SSL con Let's Encrypt (opcional)
# Ejecutar después del deploy.sh si tienes un dominio

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

# Verificar si se proporcionó un dominio
if [ -z "$1" ]; then
    print_error "Por favor proporciona un dominio como argumento."
    print_status "Uso: ./setup-ssl.sh tu-dominio.com"
    exit 1
fi

DOMAIN=$1
PROJECT_NAME="inexcons"

print_status "🔒 Configurando SSL para $DOMAIN..."

# Instalar Certbot
print_status "📦 Instalando Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Actualizar configuración de Nginx para el dominio
print_status "🌐 Actualizando configuración de Nginx..."
sudo tee /etc/nginx/sites-available/$PROJECT_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root /var/www/$PROJECT_NAME/frontend/dist;
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
        proxy_pass http://localhost:8000;
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
        proxy_pass http://localhost:8000;
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

# Validar configuración de Nginx
sudo nginx -t
sudo systemctl reload nginx

# Obtener certificado SSL
print_status "🔐 Obteniendo certificado SSL..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Configurar renovación automática
print_status "🔄 Configurando renovación automática..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

print_success "🎉 SSL configurado exitosamente!"
print_success "🌐 Tu aplicación está disponible en: https://$DOMAIN"
print_status "🔄 El certificado se renovará automáticamente cada 90 días"
