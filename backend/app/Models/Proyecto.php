<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Proyecto extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'montoTotal',
        'iva',
        'fechaInicio',
        'fechaFinalizacion',
        'anticipo'
    ];

    protected $casts = [
        'montoTotal' => 'decimal:2',
        'iva' => 'decimal:2',
        'anticipo' => 'decimal:2',
        'fechaInicio' => 'date',
        'fechaFinalizacion' => 'date'
    ];

    public function pagos()
    {
        return $this->hasMany(Pago::class);
    }

    public function pagosConceptos()
    {
        return $this->hasManyThrough(Pago::class, Concepto::class);
    }

    public function contratistas()
    {
        return $this->belongsToMany(Contratista::class);
    }

    public function trabajadores()
    {
        return $this->belongsToMany(Trabajador::class)
            ->withPivot('fecha_asignacion', 'fecha_finalizacion', 'observaciones')
            ->withTimestamps();
    }

    public function conceptos()
    {
        return $this->hasMany(Concepto::class);
    }

    public function conceptosPorContratista($contratistaId)
    {
        return $this->conceptos()->where('contratista_id', $contratistaId)->get();
    }

    public function gastosGenerales()
    {
        return $this->hasMany(GastoGeneral::class);
    }
}
