# INEXCONS Droplet - Sistema de Gestión de Proyectos

Sistema integral de gestión de proyectos, contratistas, trabajadores y nóminas para INEXCONS, desplegado en DigitalOcean.

## 📋 Información del Sistema

- **Servidor**: Ubuntu 24.10 (Oracular) en DigitalOcean Droplet
- **IP Pública**: 137.184.18.22
- **Backend**: Laravel con PHP 8.3
- **Frontend**: React con Vite
- **Base de Datos**: SQLite
- **Servidor Web**: Nginx
- **Gestión de Servicios**: systemd

## 🚀 Acceso a la Aplicación

- **URL Principal**: http://137.184.18.22
- **API Backend**: http://137.184.18.22/api/
- **Archivos**: http://137.184.18.22/storage/

## 📦 Instalación y Deploy

### Prerequisitos

- Acceso SSH al droplet como root
- Git instalado
- Conexión a internet estable

### Deploy Completo

```bash
# 1. Clonar o actualizar repositorio
git clone <repository-url> INEXCONS_DROPLET
cd INEXCONS_DROPLET

# 2. Ejecutar limpieza del sistema (recomendado)
sudo bash clean-system.sh

# 3. Ejecutar deploy principal
sudo bash deploy.sh
```

## 🔧 Scripts de Mantenimiento

### 1. Limpieza de Sistema APT

```bash
# Limpiar repositorios problemáticos y migrar claves Docker
sudo bash scripts/fix_apt_repos.sh
```

**Qué hace:**

- Elimina repositorios PPA de Ondrej rotos
- Migra clave Docker del keyring legacy
- Actualiza configuración a formato moderno
- Ejecuta `apt update && apt upgrade`

### 2. Configuración TMPDIR para Cursor

```bash
# Configurar TMPDIR=/tmp para root y Cursor
sudo bash scripts/set_tmpdir_root.sh
```

**Qué hace:**

- Configura `TMPDIR=/tmp` en `/root/.profile`
- Crea `/root/.cursor-remote-env.sh`
- Establece permisos 700 en `/root/.cursor-server`
- Crea script de verificación

### 3. Verificación de Sistema y Reboot

```bash
# Verificar estado del kernel y sistema
bash scripts/post_reboot_notes.sh
```

**Qué hace:**

- Detecta diferencias entre kernel activo vs instalado
- Verifica paquetes que requieren reboot
- Revisa servicios que necesitan reinicio
- Proporciona recomendaciones de mantenimiento

### 4. Arreglo de Migraciones Laravel

```bash
# Arreglar migraciones para evitar duplicate column errors
bash scripts/fix_laravel_migrations.sh

# Ejecutar migraciones de forma segura
bash scripts/safe_migrate.sh
```

**Qué hace:**

- Arregla migraciones con verificación de columnas existentes
- Crea migraciones idempotentes
- Backup automático de base de datos
- Verificación de integridad

## 🎯 Checklist Post-Deploy

### Verificación del Sistema

```bash
# 1. Configurar paquetes pendientes
sudo dpkg --configure -a

# 2. Reparar dependencias rotas
sudo apt-get -f install

# 3. Actualizar sistema completo
sudo apt update && sudo apt upgrade -y

# 4. Verificar herramientas instaladas
php -v                    # Debe mostrar PHP 8.3+
node -v                   # Debe mostrar Node.js 18+
nginx -v                  # Debe mostrar Nginx
composer --version        # Debe mostrar Composer
```

### Verificación de Laravel

```bash
cd /mnt/volume_nyc1_01/inexcons/backend

# Verificar estado de migraciones
php artisan migrate:status

# Ejecutar migraciones si es necesario
php artisan migrate

# Regenerar cache de configuración
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Verificación de Servicios

```bash
# Estado de servicios INEXCONS
sudo systemctl status inexcons-backend inexcons-frontend nginx

# Logs de servicios (últimas 1 hora)
sudo journalctl -u inexcons-backend --since '1 hour ago'
sudo journalctl -u inexcons-frontend --since '1 hour ago'

# Verificación de puertos
ss -tlnp | grep -E ':80|:8000|:5173'
```

### Verificación Web

```bash
# Verificar respuesta HTTP
curl -I http://137.184.18.22

# Verificar API (si existe endpoint de salud)
curl http://137.184.18.22/api/health || echo 'Endpoint no disponible'

# Verificar que el frontend carga
curl -s http://137.184.18.22 | grep -q "React" && echo "Frontend OK" || echo "Frontend Error"
```

## 🛠️ Administración de Servicios

### Comandos Básicos

```bash
# Control general de servicios
inexcons-control start|stop|restart|status

# Ver logs en tiempo real
inexcons-control logs [backend|frontend|nginx]

# Mantenimiento del sistema
inexcons-maintenance backup|cleanup|check|optimize|full

# Actualizar aplicación
inexcons-update
```

### Comandos systemd Nativos

```bash
# Iniciar/detener servicios
sudo systemctl start inexcons-backend inexcons-frontend
sudo systemctl stop inexcons-backend inexcons-frontend

# Reiniciar servicios
sudo systemctl restart inexcons-backend inexcons-frontend
sudo systemctl reload nginx

# Ver estado detallado
sudo systemctl status inexcons-backend inexcons-frontend nginx

# Habilitar/deshabilitar inicio automático
sudo systemctl enable inexcons-backend inexcons-frontend
sudo systemctl disable inexcons-backend inexcons-frontend

# Ver logs
sudo journalctl -u inexcons-backend -f
sudo journalctl -u inexcons-frontend -f
```

## 🔍 Solución de Problemas

### Problema: Error "duplicate column proyecto_id"

```bash
# Ejecutar arreglo de migraciones
bash scripts/fix_laravel_migrations.sh
bash scripts/safe_migrate.sh
```

### Problema: Servicios no inician

```bash
# Verificar configuración
sudo systemctl show inexcons-backend
sudo journalctl -u inexcons-backend -n 50

# Recargar configuración y reiniciar
sudo systemctl daemon-reload
sudo systemctl restart inexcons-backend inexcons-frontend
```

### Problema: Errores de APT/repositorios

```bash
# Limpiar repositorios problemáticos
sudo bash scripts/fix_apt_repos.sh

# Verificar estado
sudo apt update
sudo apt list --upgradable
```

### Problema: Cursor no funciona correctamente

```bash
# Configurar TMPDIR
sudo bash scripts/set_tmpdir_root.sh

# Verificar configuración
sudo /root/check_tmpdir.sh

# Cargar nueva configuración
source /root/.profile
```

### Problema: Kernel desactualizado

```bash
# Verificar estado
bash scripts/post_reboot_notes.sh

# Si recomienda reboot, programar mantenimiento
sudo reboot

# Después del reboot, verificar
bash /tmp/post_reboot_checklist.sh
```

## 📁 Estructura del Proyecto

```
INEXCONS_DROPLET/
├── backend/                 # Laravel API
│   ├── app/
│   ├── database/
│   ├── routes/
│   └── artisan
├── frontend/                # React aplicación
│   ├── src/
│   ├── dist/               # Build de producción
│   └── package.json
├── scripts/                # Scripts de mantenimiento
│   ├── fix_apt_repos.sh
│   ├── set_tmpdir_root.sh
│   ├── post_reboot_notes.sh
│   ├── fix_laravel_migrations.sh
│   └── safe_migrate.sh
├── services/               # Archivos systemd
│   ├── inexcons-backend.service
│   └── inexcons-frontend.service
├── deploy.sh              # Script principal de deploy
├── clean-system.sh        # Limpieza pre-deploy
├── inexcons-control.sh    # Control de servicios
├── maintenance.sh         # Mantenimiento sistema
└── README.md             # Esta documentación
```

## 🔐 Archivos de Configuración

### Servicios systemd

- `/etc/systemd/system/inexcons-backend.service`
- `/etc/systemd/system/inexcons-frontend.service`

### Nginx

- `/etc/nginx/sites-available/inexcons`
- `/etc/nginx/sites-enabled/inexcons`

### Logs

- **Backend**: `sudo journalctl -u inexcons-backend`
- **Frontend**: `sudo journalctl -u inexcons-frontend`
- **Nginx**: `/var/log/nginx/inexcons_*.log`
- **Laravel**: `/mnt/volume_nyc1_01/inexcons/backend/storage/logs/`

### Base de Datos

- **SQLite**: `/mnt/volume_nyc1_01/inexcons/backend/database/database.sqlite`
- **Backups**: `/mnt/volume_nyc1_01/backups/inexcons/`

## ⚠️ Notas Importantes

### Reboot Pendiente

Si `scripts/post_reboot_notes.sh` indica que hay un reboot pendiente:

1. **Planifica una ventana de mantenimiento**
2. **Notifica a los usuarios**
3. **Ejecuta**: `sudo reboot`
4. **Verifica después**: `bash /tmp/post_reboot_checklist.sh`

### Backup Regular

- **Base de datos**: Se respalda automáticamente antes de cada migración
- **Manual**: `inexcons-maintenance backup`
- **Ubicación**: `/mnt/volume_nyc1_01/backups/inexcons/`

### Monitoreo Recomendado

```bash
# Configurar verificaciones automáticas (crontab -e)
# Verificación cada 30 minutos
*/30 * * * * /usr/local/bin/inexcons-maintenance check > /dev/null 2>&1

# Backup diario a las 2 AM
0 2 * * * /usr/local/bin/inexcons-maintenance backup > /dev/null 2>&1

# Limpieza semanal los domingos a las 3 AM
0 3 * * 0 /usr/local/bin/inexcons-maintenance cleanup > /dev/null 2>&1
```

## 🆘 Soporte

### Logs para Debugging

```bash
# Logs completos del sistema
inexcons-control status

# Logs específicos en tiempo real
sudo journalctl -u inexcons-backend -f
sudo journalctl -u inexcons-frontend -f

# Logs de errores de Nginx
sudo tail -f /var/log/nginx/inexcons_error.log

# Logs de Laravel
sudo tail -f /mnt/volume_nyc1_01/inexcons/backend/storage/logs/laravel.log
```

### Comandos de Emergencia

```bash
# Reiniciar todo el stack
sudo systemctl restart inexcons-backend inexcons-frontend nginx

# Verificar conectividad
ping 8.8.8.8
curl -I http://137.184.18.22

# Verificar espacio en disco
df -h /mnt/volume_nyc1_01

# Verificar procesos
ps aux | grep -E "(php|node|nginx)"
```

---

## 📚 Documentación Adicional

- [SERVICIOS.md](SERVICIOS.md) - Gestión detallada de servicios
- [DEPLOYMENT.md](DEPLOYMENT.md) - Proceso de despliegue paso a paso
- Logs del sistema para troubleshooting específico

---

**INEXCONS** - Sistema de Gestión de Proyectos
Desplegado en DigitalOcean | Última actualización: $(date)
