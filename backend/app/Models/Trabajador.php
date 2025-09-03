<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Trabajador extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'apellidos',
        'fecha_contratacion',
        'sueldo_base',
        'telefono',
        'ine',
        'rfc'
    ];

    protected $casts = [
        'fecha_contratacion' => 'date',
        'sueldo_base' => 'decimal:2',
    ];

    public function proyectos()
    {
        return $this->belongsToMany(Proyecto::class)
            ->withPivot('fecha_asignacion', 'fecha_finalizacion', 'observaciones')
            ->withTimestamps();
    }

    public function pagos()
    {
        return $this->hasMany(PagoTrabajador::class);
    }
}
