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
        Schema::create('proyecto_historials', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->decimal('montoTotal', 10, 2);
            $table->decimal('iva', 10, 2)->nullable();
            $table->date('fechaInicio')->nullable();
            $table->date('fechaFinalizacion')->nullable();
            $table->decimal('anticipo', 10, 2)->nullable();
            $table->date('fecha_eliminacion');
            $table->json('contratistas')->nullable();
            $table->json('trabajadores')->nullable();
            $table->json('pagos_cliente')->nullable();
            $table->json('conceptos')->nullable();
            $table->json('gastos_generales')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proyecto_historials');
    }
};
