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
        Schema::create('nomina_semanals', function (Blueprint $table) {
            $table->id();
            $table->integer('anio');
            $table->integer('numero_semana');
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->decimal('total_pagado', 12, 2)->default(0);
            $table->decimal('total_pendiente', 12, 2)->default(0);
            $table->boolean('cerrada')->default(false);
            $table->text('observaciones')->nullable();
            $table->timestamps();

            // Índice para búsquedas por año y semana
            $table->unique(['anio', 'numero_semana']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nomina_semanals');
    }
};
