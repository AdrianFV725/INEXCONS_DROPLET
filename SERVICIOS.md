# Gestión de Servicios INEXCONS

Esta aplicación está configurada para ejecutarse como servicios systemd en tu droplet de DigitalOcean. Esto proporciona mayor estabilidad, reinicio automático en caso de errores, y una gestión más robusta de los procesos.

## Servicios Configurados

- **inexcons-backend**: Servicio Laravel (puerto 8000)
- **inexcons-frontend**: Servicio React con Vite (puerto 5173)
- **nginx**: Servidor web que sirve la aplicación (puerto 80)

## Comandos Básicos

### Control de Servicios

```bash
# Iniciar todos los servicios
sudo systemctl start inexcons-backend inexcons-frontend nginx

# Detener servicios INEXCONS
sudo systemctl stop inexcons-backend inexcons-frontend

# Reiniciar servicios
sudo systemctl restart inexcons-backend inexcons-frontend
sudo systemctl reload nginx

# Ver estado de servicios
sudo systemctl status inexcons-backend inexcons-frontend nginx
```

### Habilitar/Deshabilitar Inicio Automático

```bash
# Habilitar inicio automático
sudo systemctl enable inexcons-backend inexcons-frontend nginx

# Deshabilitar inicio automático
sudo systemctl disable inexcons-backend inexcons-frontend
```

### Ver Logs

```bash
# Logs del backend en tiempo real
sudo journalctl -u inexcons-backend -f

# Logs del frontend en tiempo real
sudo journalctl -u inexcons-frontend -f

# Logs de ambos servicios
sudo journalctl -u inexcons-backend -u inexcons-frontend -f

# Logs desde una fecha específica
sudo journalctl -u inexcons-backend --since "2024-01-01 10:00:00"

# Últimas 100 líneas del log
sudo journalctl -u inexcons-backend -n 100
```

## Scripts de Administración

### 1. Control de Servicios (`inexcons-control`)

Script principal para gestionar los servicios INEXCONS:

```bash
# Uso básico
inexcons-control [comando] [opciones]

# Ejemplos
inexcons-control start      # Iniciar servicios
inexcons-control stop       # Detener servicios
inexcons-control restart    # Reiniciar servicios
inexcons-control status     # Ver estado
inexcons-control logs       # Ver logs combinados
inexcons-control logs backend    # Ver logs del backend
inexcons-control logs frontend   # Ver logs del frontend
inexcons-control enable     # Habilitar inicio automático
inexcons-control disable    # Deshabilitar inicio automático
```

### 2. Mantenimiento (`inexcons-maintenance`)

Script para tareas de mantenimiento del sistema:

```bash
# Uso básico
inexcons-maintenance [comando]

# Comandos disponibles
inexcons-maintenance backup    # Backup de base de datos
inexcons-maintenance cleanup   # Limpiar logs y backups antiguos
inexcons-maintenance check     # Verificar sistema y servicios
inexcons-maintenance optimize  # Optimizar Laravel
inexcons-maintenance full      # Mantenimiento completo
```

### 3. Actualización (`inexcons-update`)

Script para actualizar la aplicación:

```bash
# Actualizar aplicación
inexcons-update
```

## Archivos de Configuración

### Servicios systemd

- `/etc/systemd/system/inexcons-backend.service`
- `/etc/systemd/system/inexcons-frontend.service`

### Configuración Nginx

- `/etc/nginx/sites-available/inexcons`
- `/etc/nginx/sites-enabled/inexcons`

### Logs del Sistema

- **Backend**: `sudo journalctl -u inexcons-backend`
- **Frontend**: `sudo journalctl -u inexcons-frontend`
- **Nginx**: `/var/log/nginx/inexcons_*.log`
- **Laravel**: `/mnt/volume_nyc1_01/inexcons/backend/storage/logs/`

## Solución de Problemas

### Verificar si los servicios están ejecutándose

```bash
# Verificar estado
sudo systemctl is-active inexcons-backend
sudo systemctl is-active inexcons-frontend
sudo systemctl is-active nginx

# O usar el script de control
inexcons-control status
```

### Servicio no inicia

1. Verificar logs:

   ```bash
   sudo journalctl -u inexcons-backend -n 50
   ```

2. Verificar configuración:

   ```bash
   sudo systemctl show inexcons-backend
   ```

3. Verificar permisos:
   ```bash
   ls -la /mnt/volume_nyc1_01/inexcons/backend/
   ```

### Problemas de permisos

```bash
# Corregir permisos del backend
sudo chown -R www-data:www-data /mnt/volume_nyc1_01/inexcons/backend/storage
sudo chown -R www-data:www-data /mnt/volume_nyc1_01/inexcons/backend/bootstrap/cache
sudo chmod -R 775 /mnt/volume_nyc1_01/inexcons/backend/storage
sudo chmod -R 775 /mnt/volume_nyc1_01/inexcons/backend/bootstrap/cache
```

### Reiniciar todo después de cambios

```bash
# Recargar configuración de systemd
sudo systemctl daemon-reload

# Reiniciar servicios
inexcons-control restart

# O manualmente
sudo systemctl restart inexcons-backend inexcons-frontend nginx
```

## Monitoreo

### Verificar uso de recursos

```bash
# CPU y memoria de los servicios
sudo systemctl status inexcons-backend inexcons-frontend

# Espacio en disco
df -h /mnt/volume_nyc1_01

# Procesos activos
ps aux | grep -E "(php|node|nginx)"
```

### Automatizar verificaciones

Puedes añadir a cron para verificaciones automáticas:

```bash
# Editar crontab
crontab -e

# Añadir verificación cada 30 minutos
*/30 * * * * /usr/local/bin/inexcons-maintenance check > /dev/null 2>&1

# Backup diario a las 2 AM
0 2 * * * /usr/local/bin/inexcons-maintenance backup > /dev/null 2>&1

# Limpieza semanal los domingos a las 3 AM
0 3 * * 0 /usr/local/bin/inexcons-maintenance cleanup > /dev/null 2>&1
```

## Actualizaciones

### Actualizar el código

```bash
inexcons-update
```

### Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### Después de actualizaciones del sistema

```bash
# Reiniciar servicios
inexcons-control restart

# Verificar que todo funcione
inexcons-control status
```

## Seguridad

### Firewall

El firewall UFW está configurado para permitir:

- SSH (puerto 22)
- HTTP/HTTPS (puertos 80/443)

### Logs de seguridad

```bash
# Ver intentos de conexión SSH
sudo journalctl -u ssh -n 100

# Ver logs del firewall
sudo ufw status verbose
```

## Contacto y Soporte

Para problemas específicos, revisa siempre los logs primero:

```bash
# Logs completos del sistema
inexcons-control status

# Mantenimiento completo
inexcons-maintenance full
```
