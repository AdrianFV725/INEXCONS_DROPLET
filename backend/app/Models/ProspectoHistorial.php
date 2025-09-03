<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProspectoHistorial extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'descripcion',
        'cliente',
        'ubicacion',
        'presupuesto_estimado',
        'fecha_estimada_inicio',
        'estado',
        'fecha_eliminacion',
        'notas'
    ];

    protected $casts = [
        'presupuesto_estimado' => 'decimal:2',
        'fecha_estimada_inicio' => 'date',
        'fecha_eliminacion' => 'date',
        'notas' => 'array'
    ];
}
