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
        Schema::create('pago_nominas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nomina_semanal_id')->constrained('nomina_semanals')->onDelete('cascade');
            $table->foreignId('trabajador_id')->nullable()->constrained('trabajadors')->onDelete('set null');
            $table->foreignId('proyecto_id')->nullable()->constrained('proyectos')->onDelete('set null');
            $table->string('nombre_receptor')->nullable(); // En caso de que el pago sea a alguien no registrado
            $table->decimal('monto', 12, 2);
            $table->date('fecha_pago');
            $table->enum('estado', ['pendiente', 'pagado'])->default('pendiente');
            $table->string('concepto')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();

            // Índice para búsqueda rápida
            $table->index(['nomina_semanal_id', 'estado']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pago_nominas');
    }
};
