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
        if (!Schema::hasTable('contratista_proyecto')) {
            Schema::create('contratista_proyecto', function (Blueprint $table) {
                $table->id();
                $table->foreignId('contratista_id')->constrained()->onDelete('cascade');
                $table->foreignId('proyecto_id')->constrained()->onDelete('cascade');
                $table->timestamps();

                // Evitar duplicados
                $table->unique(['contratista_id', 'proyecto_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contratista_proyecto');
    }
};
