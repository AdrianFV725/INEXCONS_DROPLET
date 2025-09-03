<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PagoTrabajador extends Model
{
    use HasFactory;

    protected $fillable = [
        'trabajador_id',
        'proyecto_id',
        'monto',
        'descripcion',
        'fecha_pago',
        'semana',
        'observaciones'
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_pago' => 'date',
    ];

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class);
    }

    public function proyecto()
    {
        return $this->belongsTo(Proyecto::class);
    }
}
