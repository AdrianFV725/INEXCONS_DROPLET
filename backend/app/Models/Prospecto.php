<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prospecto extends Model
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
    ];

    protected $casts = [
        'presupuesto_estimado' => 'decimal:2',
        'fecha_estimada_inicio' => 'date',
    ];

    /**
     * Obtener las notas asociadas al prospecto.
     */
    public function notas()
    {
        return $this->hasMany(ProspectoNota::class);
    }
}
