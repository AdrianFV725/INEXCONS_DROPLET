#!/bin/bash

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    cat > .env << EOF
APP_NAME=INEXCONS
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://167.172.114.3

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=sqlite
DB_DATABASE=/var/www/html/database/database.sqlite

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120
EOF
fi

# Generar clave de aplicación
php artisan key:generate --force

# Ejecutar migraciones
php artisan migrate --force

# Optimizar Laravel
php artisan config:cache
php artisan route:cache

# Iniciar Apache
apache2-foreground
