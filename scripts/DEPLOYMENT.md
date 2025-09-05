# 🚀 Guía de Despliegue de INEXCONS en DigitalOcean Droplet

Esta guía te ayudará a desplegar tu aplicación INEXCONS en un droplet de DigitalOcean con IP `137.184.18.22`.

💾 **NOTA IMPORTANTE**: El proyecto se instalará automáticamente en el volumen `/mnt/volume_nyc1_01` que tiene mayor espacio disponible (8.2GB) en lugar del disco principal. Esto optimiza el uso del almacenamiento y mejora el rendimiento.

## 📋 Requisitos Previos

- Droplet de DigitalOcean con Ubuntu 20.04 o superior
- Acceso SSH al droplet
- Al menos 2GB de RAM y 25GB de almacenamiento
- Volumen adicional montado (recomendado para mayor espacio)

### 💾 Verificación del Espacio de Almacenamiento

Antes del despliegue, verifica el espacio disponible:

```bash
# Verificar todos los volúmenes montados
df -h

# El script detectará automáticamente el volumen con más espacio
# En este caso: /mnt/volume_nyc1_01 (8.2GB disponibles)
```

## 🔧 Instalación

### Paso 1: Conectar al Droplet

```bash
ssh root@137.184.18.22
```

### Paso 2: Subir los Archivos del Proyecto

Puedes usar una de estas opciones:

#### Opción A: Usando Git (Recomendado)

```bash
# En tu droplet
apt update && apt install -y git
git clone <tu-repositorio> /tmp/inexcons-project
cd /tmp/inexcons-project
```

#### Opción B: Usando SCP

```bash
# Desde tu máquina local
scp -r "/Users/adrianfloresvillatoro/Documents/PROYECTOS/INEXCONS Droplet/" root@137.184.18.22:/tmp/inexcons-project
```

### Paso 3: Ejecutar el Script de Despliegue

```bash
# En tu droplet
cd /tmp/inexcons-project
chmod +x deploy.sh
./deploy.sh
```

El script realizará automáticamente:

- ✅ **Detección del volumen con más espacio** (`/mnt/volume_nyc1_01`)
- ✅ **Verificación de permisos** y configuración del volumen
- ✅ Instalación de PHP 8.2, Node.js 18, Composer, PM2, Nginx
- ✅ Configuración del backend Laravel en el volumen
- ✅ Configuración del frontend React
- ✅ Creación de servicios systemd
- ✅ Configuración de Nginx como proxy reverso
- ✅ Configuración de firewall
- ✅ **Creación de comandos rápidos** (`inexcons-update`, `inexcons-maintenance`)

## 🌐 Acceso a la Aplicación

Una vez completado el despliegue:

- **URL de la aplicación:** http://137.184.18.22
- **Frontend:** Servido por Nginx en puerto 80
- **Backend API:** Laravel en puerto 8000 (interno)
- **Base de datos:** SQLite en `/mnt/volume_nyc1_01/inexcons/backend/database/database.sqlite`

## 🔒 Configuración SSL (Opcional)

Si tienes un dominio propio:

```bash
# Configurar SSL con Let's Encrypt
chmod +x setup-ssl.sh
./setup-ssl.sh tu-dominio.com
```

## 🔧 Comandos de Administración

### Verificar Estado de Servicios

```bash
# Backend Laravel
sudo systemctl status inexcons-backend

# Frontend React
pm2 status

# Nginx
sudo systemctl status nginx
```

### Ver Logs

```bash
# Logs del backend
sudo journalctl -u inexcons-backend -f

# Logs del frontend
pm2 logs inexcons-frontend

# Logs de Nginx
sudo tail -f /var/log/nginx/inexcons_access.log
sudo tail -f /var/log/nginx/inexcons_error.log
```

### Reiniciar Servicios

```bash
# Reiniciar backend
sudo systemctl restart inexcons-backend

# Reiniciar frontend
pm2 restart inexcons-frontend

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 🔄 Actualización del Proyecto

Para actualizar el código en producción:

```bash
cd /mnt/volume_nyc1_01/inexcons
./update.sh
```

O usa el comando rápido desde cualquier ubicación:

```bash
inexcons-update
```

## 🧹 Mantenimiento

Ejecutar mantenimiento semanal:

```bash
chmod +x maintenance.sh
./maintenance.sh
```

El script de mantenimiento:

- 💾 Crea backups automáticos
- 🧹 Limpia logs antiguos
- ⚡ Optimiza la base de datos
- 🔍 Verifica el estado de servicios
- 📊 Genera reportes de estado

### Programar Mantenimiento Automático

```bash
# Agregar al crontab para ejecutar cada domingo a las 3 AM
sudo crontab -e

# Agregar esta línea:
0 3 * * 0 /mnt/volume_nyc1_01/inexcons/maintenance.sh

# O usar el comando rápido:
0 3 * * 0 inexcons-maintenance
```

## 📁 Estructura de Archivos

```
/mnt/volume_nyc1_01/inexcons/     # Proyecto en volumen con más espacio
├── backend/                      # Laravel API
│   ├── database/
│   │   └── database.sqlite       # Base de datos SQLite
│   └── storage/
│       └── logs/                # Logs de Laravel
├── frontend/               # React App
│   ├── dist/              # Build de producción
│   └── ecosystem.config.js # Configuración PM2
└── update.sh              # Script de actualización
```

## 🔍 Solución de Problemas

### La aplicación no carga

1. Verificar servicios:

```bash
sudo systemctl status inexcons-backend nginx
pm2 status
```

2. Verificar logs:

```bash
sudo journalctl -u inexcons-backend -n 50
pm2 logs inexcons-frontend --lines 50
```

### Error de base de datos

1. Verificar permisos:

```bash
ls -la /mnt/volume_nyc1_01/inexcons/backend/database/
```

2. Recrear base de datos:

```bash
cd /mnt/volume_nyc1_01/inexcons/backend
sudo rm database/database.sqlite
touch database/database.sqlite
php artisan migrate --force
```

### Error 502 Bad Gateway

1. Verificar que el backend esté corriendo:

```bash
sudo systemctl restart inexcons-backend
sudo systemctl status inexcons-backend
```

2. Verificar configuración de Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Seguridad

### Cambiar Credenciales por Defecto

1. Crear usuario administrador:

```bash
cd /mnt/volume_nyc1_01/inexcons/backend
php artisan tinker

# En tinker:
$user = new App\Models\User();
$user->name = 'Administrador';
$user->email = 'admin@inexcons.com';
$user->password = Hash::make('tu-nueva-contraseña-segura');
$user->save();
```

### Configuraciones de Seguridad Adicionales

1. **Firewall configurado** - Solo puertos 22 (SSH) y 80/443 (HTTP/HTTPS)
2. **Servicios con usuarios limitados** - Laravel corre como `www-data`
3. **Logs de acceso** - Todos los accesos se registran
4. **Backups automáticos** - Base de datos respaldada regularmente

## 📞 Soporte

- **Logs de aplicación:** `/mnt/volume_nyc1_01/inexcons/backend/storage/logs/`
- **Logs de mantenimiento:** `/mnt/volume_nyc1_01/logs/inexcons-maintenance.log`
- **Backups:** `/mnt/volume_nyc1_01/backups/inexcons/`
- **Logs de sistema:** `sudo journalctl -u inexcons-backend`
- **Logs de Nginx:** `/var/log/nginx/inexcons_*.log`
- **Estado de servicios:** `sudo systemctl status inexcons-backend nginx`

## 💾 Administración del Volumen

### Comandos Útiles para el Volumen

```bash
# Verificar espacio en el volumen
df -h /mnt/volume_nyc1_01

# Ver estructura del proyecto
ls -la /mnt/volume_nyc1_01/inexcons/

# Verificar backups
ls -la /mnt/volume_nyc1_01/backups/inexcons/

# Ver logs de mantenimiento
tail -f /mnt/volume_nyc1_01/logs/inexcons-maintenance.log
```

### Comandos Rápidos Disponibles

```bash
# Actualizar proyecto (desde cualquier ubicación)
inexcons-update

# Ejecutar mantenimiento
inexcons-maintenance

# Ver estado de servicios
sudo systemctl status inexcons-backend nginx
pm2 status
```

## 🎯 Próximos Pasos Recomendados

1. **Configurar SSL** si tienes un dominio
2. **Configurar backups remotos** (S3, Google Drive, etc.)
3. **Monitorear espacio del volumen** regularmente
4. **Monitoreo avanzado** con herramientas como New Relic o DataDog
5. **CD/CI** para automatizar despliegues futuros

---

¡Tu aplicación INEXCONS está lista para producción! 🎉
