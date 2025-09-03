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
        Schema::table('gasto_generals', function (Blueprint $table) {
            $table->foreignId('pago_nomina_id')->nullable()->after('proyecto_id')->constrained('pago_nominas')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gasto_generals', function (Blueprint $table) {
            $table->dropForeign(['pago_nomina_id']);
            $table->dropColumn('pago_nomina_id');
        });
    }
};
