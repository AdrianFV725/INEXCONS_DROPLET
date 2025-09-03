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
        Schema::create('prospectos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->string('cliente')->nullable();
            $table->string('ubicacion')->nullable();
            $table->decimal('presupuesto_estimado', 12, 2)->nullable();
            $table->date('fecha_estimada_inicio')->nullable();
            $table->enum('estado', ['pendiente', 'en_seguimiento', 'convertido', 'cancelado'])->default('pendiente');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prospectos');
    }
};
