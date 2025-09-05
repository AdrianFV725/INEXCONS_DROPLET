#!/bin/bash

# Script super simple para deploy con Docker
# Solo ejecuta: ./deploy-docker.sh

set -e

echo "🐳 Instalando Docker en el droplet..."

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "✅ Docker instalado correctamente"

# Limpiar contenedores anteriores si existen
sudo docker-compose down 2>/dev/null || true
sudo docker system prune -f

echo "🚀 Construyendo y iniciando contenedores..."

# Construir e iniciar servicios
sudo docker-compose up --build -d

echo "🔍 Verificando servicios..."
sudo docker-compose ps

echo "🎉 ¡Aplicación desplegada!"
echo "📱 Tu app está disponible en: http://167.172.114.3"
echo ""
echo "📋 Comandos útiles:"
echo "  • Ver logs: sudo docker-compose logs -f"
echo "  • Reiniciar: sudo docker-compose restart"
echo "  • Detener: sudo docker-compose down"
echo "  • Ver estado: sudo docker-compose ps"
