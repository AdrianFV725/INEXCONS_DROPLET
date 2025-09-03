# INEXCONS Project

Este proyecto utiliza Laravel para el backend y React + Vite + Tailwind para el frontend.

## Requisitos

- PHP >= 8.2
- Composer
- Node.js >= 16
- NPM
- MySQL

## Instalación

### Backend (Laravel)

1. Navegar al directorio del backend:

```bash
cd backend
```

2. Instalar dependencias:

```bash
composer install
```

3. Copiar el archivo de configuración:

```bash
cp .env.example .env
```

4. Configurar la base de datos en el archivo .env

5. Generar la clave de la aplicación:

```bash
php artisan key:generate
```

6. Ejecutar las migraciones:

```bash
php artisan migrate
```

7. Iniciar el servidor:

```bash
php artisan serve
```

### Frontend (React + Vite + Tailwind)

1. Navegar al directorio del frontend:

```bash
cd frontend
```

2. Instalar dependencias:

```bash
npm install
```

3. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

## Uso

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
