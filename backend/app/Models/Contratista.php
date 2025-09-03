<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contratista extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'rfc',
        'telefono',
        'especialidad_id'
    ];

    public function proyectos()
    {
        return $this->belongsToMany(Proyecto::class);
    }

    public function conceptos()
    {
        return $this->hasMany(Concepto::class);
    }

    public function conceptosPorProyecto($proyectoId)
    {
        return $this->conceptos()->where('proyecto_id', $proyectoId)->get();
    }

    public function especialidad()
    {
        return $this->belongsTo(Especialidad::class);
    }
}
