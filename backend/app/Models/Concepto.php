<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Concepto extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'descripcion',
        'monto_total',
        'anticipo',
        'proyecto_id',
        'contratista_id'
    ];

    protected $casts = [
        'monto_total' => 'decimal:2',
        'anticipo' => 'decimal:2'
    ];

    // Relación con Proyecto
    public function proyecto()
    {
        return $this->belongsTo(Proyecto::class);
    }

    // Relación con Contratista
    public function contratista()
    {
        return $this->belongsTo(Contratista::class);
    }

    // Relación con Pagos
    public function pagos()
    {
        return $this->hasMany(Pago::class);
    }
}
