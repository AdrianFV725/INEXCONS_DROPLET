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
        Schema::table('pago_trabajadors', function (Blueprint $table) {
            $table->string('descripcion')->nullable()->after('monto');
            // Hacer que el campo semana sea nullable para permitir pagos extras sin semana
            $table->integer('semana')->nullable()->change();
            // Hacer que el campo proyecto_id sea nullable para permitir pagos extras sin proyecto
            $table->foreignId('proyecto_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pago_trabajadors', function (Blueprint $table) {
            $table->dropColumn('descripcion');
            $table->integer('semana')->nullable(false)->change();
            $table->foreignId('proyecto_id')->nullable(false)->change();
        });
    }
};
