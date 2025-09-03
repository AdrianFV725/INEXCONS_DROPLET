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
        Schema::create('conceptos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->decimal('monto_total', 12, 2);
            $table->decimal('anticipo', 12, 2)->default(0);
            $table->foreignId('proyecto_id')->constrained()->onDelete('cascade');
            $table->foreignId('contratista_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            // Índices para mejorar el rendimiento de las consultas
            $table->index(['proyecto_id', 'contratista_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conceptos');
    }
};
