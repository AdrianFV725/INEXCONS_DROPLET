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
        if (!Schema::hasTable('pagos')) {
            Schema::create('pagos', function (Blueprint $table) {
                $table->id();
                $table->foreignId('concepto_id')->constrained()->onDelete('cascade');
                $table->decimal('monto', 12, 2);
                $table->date('fecha');
                $table->text('descripcion')->nullable();
                $table->boolean('es_anticipo')->default(false);
                $table->timestamps();

                // Índice para mejorar el rendimiento de las consultas
                $table->index('concepto_id');
            });
        } else {
            // Si la tabla ya existe, modificarla para agregar la columna concepto_id y es_anticipo
            Schema::table('pagos', function (Blueprint $table) {
                if (!Schema::hasColumn('pagos', 'concepto_id')) {
                    $table->foreignId('concepto_id')->nullable()->after('id');
                }
                if (!Schema::hasColumn('pagos', 'es_anticipo')) {
                    $table->boolean('es_anticipo')->default(false)->after('descripcion');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No eliminamos la tabla si ya existía
        if (Schema::hasTable('pagos') && Schema::hasColumn('pagos', 'concepto_id')) {
            Schema::table('pagos', function (Blueprint $table) {
                $table->dropColumn('concepto_id');
                if (Schema::hasColumn('pagos', 'es_anticipo')) {
                    $table->dropColumn('es_anticipo');
                }
            });
        }
    }
};
