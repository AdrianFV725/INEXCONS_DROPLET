#!/bin/bash

# Script para arreglar migraciones Laravel y evitar duplicate column errors
# Uso: bash scripts/fix_laravel_migrations.sh

set -e

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

# Verificar que estamos en el directorio correcto
if [ ! -d "backend/database/migrations" ]; then
    print_error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    print_status "Directorio actual: $(pwd)"
    print_status "Esperado: directorio que contiene 'backend/database/migrations'"
    exit 1
fi

print_status "🔧 Arreglando migraciones Laravel para evitar duplicate column errors..."

# 1. Arreglar migración de pago_nominas que no verifica columna existente
MIGRATION_FILE="backend/database/migrations/2025_03_20_000001_add_proyecto_id_to_pago_nominas_table.php"

if [ -f "$MIGRATION_FILE" ]; then
    print_status "Arreglando migración: $MIGRATION_FILE"
    
    # Crear backup
    cp "$MIGRATION_FILE" "$MIGRATION_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Aplicar fix para verificar si la columna ya existe
    cat > "$MIGRATION_FILE" << 'EOF'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pago_nominas', function (Blueprint $table) {
            // Verificar que la columna no existe antes de agregarla
            if (!Schema::hasColumn('pago_nominas', 'proyecto_id')) {
                $table->foreignId('proyecto_id')->nullable()->after('trabajador_id')->constrained('proyectos')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pago_nominas', function (Blueprint $table) {
            if (Schema::hasColumn('pago_nominas', 'proyecto_id')) {
                $table->dropForeign(['proyecto_id']);
                $table->dropColumn('proyecto_id');
            }
        });
    }
};
EOF
    
    print_success "✅ Migración $MIGRATION_FILE arreglada"
else
    print_warning "⚠️ Migración $MIGRATION_FILE no encontrada"
fi

# 2. Crear nueva migración idempotente para verificar todas las columnas
NEW_MIGRATION_NAME="fix_duplicate_columns_check"
NEW_MIGRATION_FILE="backend/database/migrations/$(date +%Y_%m_%d_%H%M%S)_${NEW_MIGRATION_NAME}.php"

print_status "Creando nueva migración idempotente: $NEW_MIGRATION_FILE"

cat > "$NEW_MIGRATION_FILE" << 'EOF'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Esta migración es idempotente y verifica todas las columnas problemáticas
     */
    public function up(): void
    {
        // Verificar y arreglar tabla pagos
        if (Schema::hasTable('pagos')) {
            Schema::table('pagos', function (Blueprint $table) {
                // Verificar proyecto_id en pagos (puede haber sido creado en migración inicial)
                if (!Schema::hasColumn('pagos', 'proyecto_id')) {
                    $table->foreignId('proyecto_id')->nullable()->after('id')->constrained('proyectos')->onDelete('cascade');
                }
                
                // Verificar otras columnas que podrían faltar
                if (!Schema::hasColumn('pagos', 'tipo')) {
                    $table->string('tipo')->nullable()->after('descripcion');
                }
            });
        }

        // Verificar y arreglar tabla pago_nominas
        if (Schema::hasTable('pago_nominas')) {
            Schema::table('pago_nominas', function (Blueprint $table) {
                if (!Schema::hasColumn('pago_nominas', 'proyecto_id')) {
                    $table->foreignId('proyecto_id')->nullable()->after('trabajador_id')->constrained('proyectos')->onDelete('set null');
                }
            });
        }

        // Verificar y arreglar tabla gasto_generals
        if (Schema::hasTable('gasto_generals')) {
            Schema::table('gasto_generals', function (Blueprint $table) {
                if (!Schema::hasColumn('gasto_generals', 'pago_nomina_id')) {
                    $table->foreignId('pago_nomina_id')->nullable()->after('proyecto_id')->constrained('pago_nominas')->onDelete('set null');
                }
            });
        }

        // Verificar índices y constraints que podrían estar duplicados
        $this->ensureProperIndexes();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Esta migración es segura de revertir ya que solo agrega columnas si no existen
        // No removemos columnas en el down para evitar pérdida de datos
    }

    /**
     * Asegurar que los índices estén correctamente configurados
     */
    private function ensureProperIndexes(): void
    {
        try {
            // Verificar índice único en contratista_proyecto si la tabla existe
            if (Schema::hasTable('contratista_proyecto')) {
                $indexes = Schema::getConnection()->getDoctrineSchemaManager()->listTableIndexes('contratista_proyecto');
                $hasUniqueIndex = false;
                
                foreach ($indexes as $index) {
                    if ($index->isUnique() && 
                        in_array('contratista_id', $index->getColumns()) && 
                        in_array('proyecto_id', $index->getColumns())) {
                        $hasUniqueIndex = true;
                        break;
                    }
                }
                
                if (!$hasUniqueIndex) {
                    Schema::table('contratista_proyecto', function (Blueprint $table) {
                        try {
                            $table->unique(['contratista_id', 'proyecto_id'], 'unique_contratista_proyecto');
                        } catch (\Exception $e) {
                            // Índice ya existe o hay datos duplicados, ignorar
                        }
                    });
                }
            }
        } catch (\Exception $e) {
            // Ignorar errores de índices ya que son optimizaciones
        }
    }
};
EOF

print_success "✅ Nueva migración idempotente creada"

# 3. Crear script de verificación de migraciones
VERIFICATION_SCRIPT="scripts/verify_migrations.php"

print_status "Creando script de verificación: $VERIFICATION_SCRIPT"

cat > "$VERIFICATION_SCRIPT" << 'EOF'
<?php

// Script para verificar el estado de las migraciones y la base de datos
// Uso: php scripts/verify_migrations.php

require_once __DIR__ . '/../backend/vendor/autoload.php';

// Configurar Laravel
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

function printStatus($message) {
    echo "\033[0;34m[INFO]\033[0m $message\n";
}

function printSuccess($message) {
    echo "\033[0;32m[SUCCESS]\033[0m $message\n";
}

function printWarning($message) {
    echo "\033[1;33m[WARNING]\033[0m $message\n";
}

function printError($message) {
    echo "\033[0;31m[ERROR]\033[0m $message\n";
}

printStatus("🔍 Verificando estado de migraciones y base de datos...");

try {
    // Verificar conexión a la base de datos
    DB::connection()->getPdo();
    printSuccess("✅ Conexión a base de datos exitosa");
} catch (Exception $e) {
    printError("❌ Error de conexión a base de datos: " . $e->getMessage());
    exit(1);
}

// Verificar tabla de migraciones
try {
    $migrations = DB::table('migrations')->get();
    printSuccess("✅ Tabla de migraciones accesible (" . count($migrations) . " migraciones)");
} catch (Exception $e) {
    printError("❌ Error accediendo tabla de migraciones: " . $e->getMessage());
    exit(1);
}

// Verificar columnas problemáticas
$tablesToCheck = [
    'pagos' => ['proyecto_id', 'tipo'],
    'pago_nominas' => ['proyecto_id'],
    'gasto_generals' => ['pago_nomina_id'],
    'contratista_proyecto' => ['contratista_id', 'proyecto_id'],
    'proyecto_trabajador' => ['proyecto_id', 'trabajador_id']
];

printStatus("📊 Verificando columnas en tablas...");

foreach ($tablesToCheck as $table => $columns) {
    if (!Schema::hasTable($table)) {
        printWarning("⚠️ Tabla '$table' no existe");
        continue;
    }
    
    printStatus("Verificando tabla '$table':");
    
    foreach ($columns as $column) {
        if (Schema::hasColumn($table, $column)) {
            printSuccess("  ✅ Columna '$column' existe");
        } else {
            printWarning("  ⚠️ Columna '$column' no existe");
        }
    }
}

// Verificar integridad de foreign keys
printStatus("🔗 Verificando foreign keys...");

$foreignKeys = [
    'pagos.proyecto_id' => 'proyectos.id',
    'pago_nominas.proyecto_id' => 'proyectos.id',
    'gasto_generals.pago_nomina_id' => 'pago_nominas.id'
];

foreach ($foreignKeys as $fk => $ref) {
    list($table, $column) = explode('.', $fk);
    
    if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
        continue;
    }
    
    try {
        // Verificar que no hay valores huérfanos
        $orphans = DB::table($table)
            ->whereNotNull($column)
            ->whereNotIn($column, function($query) use ($ref) {
                list($refTable, $refColumn) = explode('.', $ref);
                $query->select($refColumn)->from($refTable);
            })
            ->count();
            
        if ($orphans > 0) {
            printWarning("  ⚠️ $orphans registros huérfanos en $fk");
        } else {
            printSuccess("  ✅ Foreign key $fk íntegra");
        }
    } catch (Exception $e) {
        printWarning("  ⚠️ Error verificando $fk: " . $e->getMessage());
    }
}

printStatus("🎯 Verificación completada");
echo "\n";
printStatus("📋 Para ejecutar migraciones:");
echo "  cd backend && php artisan migrate\n";
printStatus("📋 Para verificar estado:");
echo "  cd backend && php artisan migrate:status\n";
EOF

chmod +x "$VERIFICATION_SCRIPT"
print_success "✅ Script de verificación creado"

# 4. Crear script para ejecutar migraciones de forma segura
SAFE_MIGRATE_SCRIPT="scripts/safe_migrate.sh"

print_status "Creando script de migración segura: $SAFE_MIGRATE_SCRIPT"

cat > "$SAFE_MIGRATE_SCRIPT" << 'EOF'
#!/bin/bash

# Script para ejecutar migraciones de Laravel de forma segura
# Uso: bash scripts/safe_migrate.sh

set -e

cd "$(dirname "$0")/.."

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_status "🚀 Ejecutando migraciones Laravel de forma segura..."

# Verificar que estamos en el directorio correcto
if [ ! -f "backend/artisan" ]; then
    print_error "No se encontró backend/artisan. Ejecuta desde el directorio raíz del proyecto."
    exit 1
fi

cd backend

# 1. Verificar estado actual
print_status "📊 Verificando estado actual de migraciones..."
php artisan migrate:status

# 2. Crear backup de la base de datos
if [ -f "database/database.sqlite" ]; then
    print_status "💾 Creando backup de la base de datos..."
    cp database/database.sqlite "database/database.sqlite.backup.$(date +%Y%m%d_%H%M%S)"
    print_success "✅ Backup creado"
fi

# 3. Ejecutar migraciones
print_status "🔧 Ejecutando migraciones..."

if php artisan migrate --force; then
    print_success "✅ Migraciones ejecutadas exitosamente"
else
    print_error "❌ Error ejecutando migraciones"
    
    # Intentar rollback si hay error
    print_status "🔄 Intentando rollback..."
    php artisan migrate:rollback --step=1 || true
    
    exit 1
fi

# 4. Verificar estado final
print_status "📊 Verificando estado final..."
php artisan migrate:status

# 5. Ejecutar verificación personalizada
cd ..
if [ -f "scripts/verify_migrations.php" ]; then
    print_status "🔍 Ejecutando verificación personalizada..."
    php scripts/verify_migrations.php
fi

print_success "🎉 Migración segura completada"
EOF

chmod +x "$SAFE_MIGRATE_SCRIPT"
print_success "✅ Script de migración segura creado"

# 5. Mostrar resumen
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📋 ARREGLOS DE MIGRACIONES COMPLETADOS"
echo "═══════════════════════════════════════════════════════════════"

echo ""
echo "🔧 Archivos modificados/creados:"
[ -f "$MIGRATION_FILE.backup."* ] && echo "  • Backup de migración original creado"
echo "  • $MIGRATION_FILE - Arreglada para verificar columna existente"
echo "  • $NEW_MIGRATION_FILE - Nueva migración idempotente"
echo "  • $VERIFICATION_SCRIPT - Script de verificación"
echo "  • $SAFE_MIGRATE_SCRIPT - Script de migración segura"

echo ""
echo "🚀 Comandos para ejecutar:"
echo "  bash $SAFE_MIGRATE_SCRIPT                    # Migrar de forma segura"
echo "  php $VERIFICATION_SCRIPT                     # Verificar estado"
echo "  cd backend && php artisan migrate:status     # Estado de migraciones"

echo ""
echo "✅ Características de los arreglos:"
echo "  • Verificación de columnas existentes antes de crear"
echo "  • Migraciones idempotentes (se pueden ejecutar múltiples veces)"
echo "  • Backup automático de la base de datos"
echo "  • Verificación de integridad de foreign keys"
echo "  • Rollback automático en caso de error"

print_success "🎉 Arreglos de migraciones Laravel completados"

