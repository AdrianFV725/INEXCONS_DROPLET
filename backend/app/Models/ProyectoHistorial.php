<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProyectoHistorial extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'montoTotal',
        'iva',
        'fechaInicio',
        'fechaFinalizacion',
        'anticipo',
        'fecha_eliminacion',
        'contratistas',
        'trabajadores',
        'pagos_cliente',
        'conceptos',
        'gastos_generales'
    ];

    protected $casts = [
        'montoTotal' => 'decimal:2',
        'iva' => 'decimal:2',
        'anticipo' => 'decimal:2',
        'fechaInicio' => 'date',
        'fechaFinalizacion' => 'date',
        'fecha_eliminacion' => 'date',
        'contratistas' => 'array',
        'trabajadores' => 'array',
        'pagos_cliente' => 'array',
        'conceptos' => 'array',
        'gastos_generales' => 'array'
    ];
}
