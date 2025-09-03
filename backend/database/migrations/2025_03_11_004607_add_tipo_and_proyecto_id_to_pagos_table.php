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
        Schema::table('pagos', function (Blueprint $table) {
            // Agregar columna tipo si no existe
            if (!Schema::hasColumn('pagos', 'tipo')) {
                $table->string('tipo')->nullable()->after('es_anticipo');
            }

            // Agregar columna proyecto_id si no existe
            if (!Schema::hasColumn('pagos', 'proyecto_id')) {
                $table->foreignId('proyecto_id')->nullable()->after('concepto_id');
                $table->foreign('proyecto_id')->references('id')->on('proyectos')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            // Eliminar columnas
            if (Schema::hasColumn('pagos', 'tipo')) {
                $table->dropColumn('tipo');
            }

            if (Schema::hasColumn('pagos', 'proyecto_id')) {
                $table->dropForeign(['proyecto_id']);
                $table->dropColumn('proyecto_id');
            }
        });
    }
};
