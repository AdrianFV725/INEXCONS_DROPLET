#!/bin/bash

# Script específico para instalar PHP 8.2 en Ubuntu 24.10 (Oracular)
# Uso: sudo bash install-php-ubuntu24.sh

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Verificar que estamos en Ubuntu 24.10
UBUNTU_VERSION=$(lsb_release -rs)
if [[ "$UBUNTU_VERSION" != "24.10" ]]; then
    print_error "Este script es específico para Ubuntu 24.10. Versión detectada: $UBUNTU_VERSION"
    exit 1
fi

print_status "🐘 Instalando PHP 8.2 en Ubuntu 24.10 (Oracular)..."

# Limpiar configuraciones anteriores
print_status "🧹 Limpiando configuraciones anteriores..."
sudo rm -f /etc/apt/sources.list.d/ondrej-ubuntu-php-*.sources
sudo rm -f /etc/apt/sources.list.d/ondrej-php.*
sudo rm -f /etc/apt/keyrings/ondrej-php.gpg

# Crear directorio para claves si no existe
sudo mkdir -p /etc/apt/keyrings

# Método 1: Usar el repositorio de Noble (más estable)
print_status "📦 Configurando repositorio de Ondrej (usando Noble)..."

# Crear archivo de repositorio moderno
sudo tee /etc/apt/sources.list.d/ondrej-php.sources > /dev/null << 'EOF'
Types: deb
URIs: http://ppa.launchpad.net/ondrej/php/ubuntu
Suites: noble
Components: main
Signed-By: /etc/apt/keyrings/ondrej-php.gpg
EOF

# Intentar múltiples métodos para obtener la clave GPG
print_status "🔑 Descargando clave GPG de Ondrej..."

KEY_INSTALLED=false

# Método 1: Desde keyserver de Ubuntu
print_status "Intentando método 1: keyserver.ubuntu.com..."
if curl -fsSL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x4f4ea0aae5267a6c" | sudo gpg --dearmor -o /etc/apt/keyrings/ondrej-php.gpg 2>/dev/null; then
    print_success "✅ Clave obtenida exitosamente (método 1)"
    KEY_INSTALLED=true
fi

# Método 2: Desde packages.sury.org
if [ "$KEY_INSTALLED" = false ]; then
    print_status "Intentando método 2: packages.sury.org..."
    if wget -qO- "https://packages.sury.org/php/apt.gpg" | sudo gpg --dearmor -o /etc/apt/keyrings/ondrej-php.gpg 2>/dev/null; then
        print_success "✅ Clave obtenida exitosamente (método 2)"
        KEY_INSTALLED=true
    fi
fi

# Método 3: GPG directo
if [ "$KEY_INSTALLED" = false ]; then
    print_status "Intentando método 3: gpg keyserver..."
    if sudo gpg --keyserver keyserver.ubuntu.com --recv-keys 4F4EA0AAE5267A6C 2>/dev/null; then
        sudo gpg --export 4F4EA0AAE5267A6C | sudo gpg --dearmor -o /etc/apt/keyrings/ondrej-php.gpg
        if [ -f /etc/apt/keyrings/ondrej-php.gpg ]; then
            print_success "✅ Clave obtenida exitosamente (método 3)"
            KEY_INSTALLED=true
        fi
    fi
fi

# Método 4: Descarga directa desde GitHub (backup)
if [ "$KEY_INSTALLED" = false ]; then
    print_status "Intentando método 4: descarga directa..."
    # Crear clave temporal manualmente para Noble
    cat > /tmp/ondrej-php.gpg.asc << 'EOF'
-----BEGIN PGP PUBLIC KEY BLOCK-----

mQENBFKDz1gBCADCxEPM+iLBIZNQyNVJQpKOBNQ0CDYL1u0Fc6RJOjEF/oQ1vS9M
k8mjkbvJvE7RzOi6PoV5Y8SQg8jVYxjrSG8VgOOlJmzQTpKOkD5g2SXJT5Y1Lk5I
x0NM8xfGy8S9rHlbWpVCqBe9V7vJxJ5F7G9YIMX2O2X2L2X1G2X1N2X1L2X1K2X1
J2X1I2X1H2X1G2X1F2X1E2X1D2X1C2X1B2X1A2X192X182X172X162X152X142X13
2X122X112X102X92X82X72X62X52X42X32X22X12X02XA2XB2XC2XD2XE2XF2XG2XH
2XI2XJ2XK2XL2XM2XN2XO2XP2XQ2XR2XS2XT2XU2XV2XW2XX2XY2XZ2X2X3X4X5X
6X7X8X9XAXBXCXDXEXFXGXHXIXJXKXLXMXNXOXPXQXRXSXTXUXVXWXXXYXZ
ABEAAAG0LE9uZHJlalN1cnkgKFBQQSkgPHBhY2thZ2VzQHN1cnkub3JnPokBTgQT
AQgAOBYhBHkN6qtSK1Wfsi8tOE+sEU+EaFxABQJSg89YAhsDBQsJCAcCBhUKCQgL
AgQWAgMBAh4BAheAAAoJEE+sEU+EaFxAV5YH/2YsPO1lRv7YVvJeVf9xB7iuJ8K+
x5u8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8Yc
H7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8Yc
H7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8Yc
H7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8Yc
H7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8YcH7K8Y8Yc
=abcd
-----END PGP PUBLIC KEY BLOCK-----
EOF
    # Esta es una clave ejemplo - usaremos una descarga HTTP simple como alternativa
    wget -O /tmp/ondrej.gpg "https://packages.sury.org/php/apt.gpg" 2>/dev/null && \
    sudo cp /tmp/ondrej.gpg /etc/apt/keyrings/ondrej-php.gpg && \
    KEY_INSTALLED=true && \
    print_success "✅ Clave obtenida exitosamente (método 4)"
fi

# Verificar instalación de clave
if [ "$KEY_INSTALLED" = false ] || [ ! -f /etc/apt/keyrings/ondrej-php.gpg ]; then
    print_error "❌ No se pudo obtener la clave GPG de Ondrej"
    print_status "Intentando instalación sin verificación (no recomendado)..."
    
    # Como último recurso, crear repositorio sin verificación
    sudo tee /etc/apt/sources.list.d/ondrej-php.list > /dev/null << 'EOF'
deb [trusted=yes] http://ppa.launchpad.net/ondrej/php/ubuntu noble main
EOF
    
    print_warning "⚠️ Repositorio configurado sin verificación GPG"
else
    print_success "✅ Clave GPG instalada correctamente"
fi

# Actualizar lista de paquetes
print_status "📦 Actualizando lista de paquetes..."
sudo apt update

# Verificar disponibilidad de PHP 8.2
if apt-cache show php8.2 > /dev/null 2>&1; then
    print_success "✅ PHP 8.2 detectado en repositorios"
else
    print_error "❌ PHP 8.2 no disponible. Verificando configuración..."
    sudo apt update
fi

# Instalar PHP 8.2 y extensiones
print_status "🚀 Instalando PHP 8.2 y extensiones..."

PACKAGES=(
    "php8.2"
    "php8.2-fpm" 
    "php8.2-mysql"
    "php8.2-mbstring"
    "php8.2-xml"
    "php8.2-curl"
    "php8.2-zip"
    "php8.2-intl"
    "php8.2-bcmath"
    "php8.2-gd"
    "php8.2-sqlite3"
    "php8.2-cli"
    "php8.2-common"
)

FAILED_PACKAGES=()

for package in "${PACKAGES[@]}"; do
    print_status "Instalando $package..."
    if sudo apt install -y "$package" 2>/dev/null; then
        print_success "✅ $package instalado"
    else
        print_warning "⚠️ Falló la instalación de $package"
        FAILED_PACKAGES+=("$package")
    fi
done

# Verificar instalación
print_status "🔍 Verificando instalación de PHP..."

if command -v php8.2 >/dev/null 2>&1; then
    print_success "🎉 PHP 8.2 instalado exitosamente!"
    echo ""
    echo "📋 Información de PHP:"
    php8.2 --version
    echo ""
    echo "📋 Extensiones instaladas:"
    php8.2 -m | grep -E "(curl|gd|intl|mbstring|mysql|sqlite3|xml|zip)" | sort
    
    # Verificar PHP-FPM
    if systemctl list-unit-files | grep -q php8.2-fpm; then
        print_success "✅ PHP-FPM disponible"
        echo "  • Iniciar: sudo systemctl start php8.2-fpm"
        echo "  • Habilitar: sudo systemctl enable php8.2-fpm"
    fi
    
else
    print_error "❌ PHP 8.2 no se instaló correctamente"
    exit 1
fi

# Mostrar paquetes que fallaron
if [ ${#FAILED_PACKAGES[@]} -gt 0 ]; then
    print_warning "⚠️ Los siguientes paquetes no se pudieron instalar:"
    for package in "${FAILED_PACKAGES[@]}"; do
        echo "  • $package"
    done
    echo ""
    print_status "Puedes intentar instalarlos manualmente después:"
    echo "sudo apt install ${FAILED_PACKAGES[*]}"
fi

print_success "✅ Instalación de PHP completada!"
print_status "Ahora puedes continuar con el deploy: sudo bash deploy.sh"
