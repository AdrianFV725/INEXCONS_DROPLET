<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('proyectos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->decimal('montoTotal', 12, 2);
            $table->decimal('iva', 12, 2);
            $table->date('fechaInicio');
            $table->date('fechaFinalizacion');
            $table->decimal('anticipo', 12, 2);
            $table->timestamps();
        });

        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proyecto_id')->constrained()->onDelete('cascade');
            $table->decimal('monto', 12, 2);
            $table->date('fecha');
            $table->string('descripcion');
            $table->timestamps();
        });

        Schema::create('contratista_proyecto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contratista_id')->constrained()->onDelete('cascade');
            $table->foreignId('proyecto_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('proyecto_trabajador', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proyecto_id')->constrained()->onDelete('cascade');
            $table->foreignId('trabajador_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('proyecto_trabajador');
        Schema::dropIfExists('contratista_proyecto');
        Schema::dropIfExists('pagos');
        Schema::dropIfExists('proyectos');
    }
};
