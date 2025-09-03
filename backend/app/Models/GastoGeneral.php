<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GastoGeneral extends Model
{
    use HasFactory;

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array
     */
    protected $fillable = [
        'descripcion',
        'monto',
        'fecha',
        'tipo',
        'proyecto_id',
        'pago_nomina_id'
    ];

    /**
     * Los atributos que deben convertirse a tipos nativos.
     *
     * @var array
     */
    protected $casts = [
        'monto' => 'float',
        'fecha' => 'date',
    ];

    /**
     * Obtener el pago de nómina asociado
     */
    public function pagoNomina()
    {
        return $this->belongsTo(PagoNomina::class);
    }

    /**
     * Boot del modelo
     */
    protected static function booted()
    {
        static::deleted(function ($gasto) {
            // Si el gasto tiene un pago de nómina asociado, actualizar el estado del pago
            if ($gasto->pago_nomina_id) {
                $pago = PagoNomina::find($gasto->pago_nomina_id);
                if ($pago) {
                    $pago->estado = 'pendiente';
                    $pago->save();
                }
            }
        });
    }
}
