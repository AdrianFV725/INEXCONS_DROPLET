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
        if (!Schema::hasTable('proyecto_trabajador')) {
            Schema::create('proyecto_trabajador', function (Blueprint $table) {
                $table->id();
                $table->foreignId('proyecto_id')->constrained('proyectos')->onDelete('cascade');
                $table->foreignId('trabajador_id')->constrained('trabajadors')->onDelete('cascade');
                $table->date('fecha_asignacion')->nullable();
                $table->date('fecha_finalizacion')->nullable();
                $table->text('observaciones')->nullable();
                $table->timestamps();
            });
        } else {
            Schema::table('proyecto_trabajador', function (Blueprint $table) {
                if (!Schema::hasColumn('proyecto_trabajador', 'proyecto_id')) {
                    $table->foreignId('proyecto_id')->constrained('proyectos')->onDelete('cascade');
                }
                if (!Schema::hasColumn('proyecto_trabajador', 'trabajador_id')) {
                    $table->foreignId('trabajador_id')->constrained('trabajadors')->onDelete('cascade');
                }
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proyecto_trabajador');
    }
};
