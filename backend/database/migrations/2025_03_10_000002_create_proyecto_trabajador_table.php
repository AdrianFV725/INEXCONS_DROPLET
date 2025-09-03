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
        Schema::table('proyecto_trabajador', function (Blueprint $table) {
            if (!Schema::hasColumn('proyecto_trabajador', 'fecha_asignacion')) {
                $table->date('fecha_asignacion')->nullable();
            }
            if (!Schema::hasColumn('proyecto_trabajador', 'fecha_finalizacion')) {
                $table->date('fecha_finalizacion')->nullable();
            }
            if (!Schema::hasColumn('proyecto_trabajador', 'observaciones')) {
                $table->text('observaciones')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proyecto_trabajador', function (Blueprint $table) {
            $table->dropColumn(['fecha_asignacion', 'fecha_finalizacion', 'observaciones']);
        });
    }
};
