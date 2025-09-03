<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    use HasFactory;

    protected $fillable = [
        'concepto_id',
        'proyecto_id',
        'monto',
        'fecha',
        'descripcion',
        'es_anticipo',
        'tipo'
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha' => 'date',
        'es_anticipo' => 'boolean'
    ];

    // Relación con Concepto
    public function concepto()
    {
        return $this->belongsTo(Concepto::class);
    }

    // Relación directa con Proyecto
    public function proyecto()
    {
        return $this->belongsTo(Proyecto::class);
    }
}
