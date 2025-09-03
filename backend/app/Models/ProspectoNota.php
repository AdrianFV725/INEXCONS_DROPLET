<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProspectoNota extends Model
{
    use HasFactory;

    protected $fillable = [
        'prospecto_id',
        'contenido',
    ];

    /**
     * Obtener el prospecto al que pertenece esta nota.
     */
    public function prospecto()
    {
        return $this->belongsTo(Prospecto::class);
    }
}
