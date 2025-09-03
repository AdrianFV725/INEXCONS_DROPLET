<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NominaSemanal extends Model
{
    use HasFactory;

    protected $fillable = [
        'anio',
        'numero_semana',
        'fecha_inicio',
        'fecha_fin',
        'total_pagado',
        'total_pendiente',
        'cerrada',
        'observaciones',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'total_pagado' => 'decimal:2',
        'total_pendiente' => 'decimal:2',
        'cerrada' => 'boolean',
    ];

    /**
     * Obtener los pagos asociados a esta nómina semanal
     */
    public function pagos()
    {
        return $this->hasMany(PagoNomina::class);
    }

    /**
     * Actualizar los totales de la nómina
     */
    public function actualizarTotales()
    {
        $this->total_pagado = $this->pagos()->where('estado', 'pagado')->sum('monto');
        $this->total_pendiente = $this->pagos()->where('estado', 'pendiente')->sum('monto');
        $this->save();
    }
}
