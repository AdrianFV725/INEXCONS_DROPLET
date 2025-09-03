<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PagoNomina extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomina_semanal_id',
        'trabajador_id',
        'proyecto_id',
        'nombre_receptor',
        'monto',
        'fecha_pago',
        'estado',
        'concepto',
        'observaciones',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_pago' => 'date',
    ];

    /**
     * Obtener la nómina semanal a la que pertenece este pago
     */
    public function nominaSemanal()
    {
        return $this->belongsTo(NominaSemanal::class);
    }

    /**
     * Obtener el trabajador asociado a este pago
     */
    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class);
    }

    /**
     * Obtener el proyecto asociado a este pago
     */
    public function proyecto()
    {
        return $this->belongsTo(Proyecto::class);
    }

    /**
     * Actualizar los totales de la nómina semanal después de guardar o actualizar
     */
    protected static function booted()
    {
        static::saved(function ($pago) {
            if ($pago->nominaSemanal) {
                $pago->nominaSemanal->actualizarTotales();
            }

            // Si el pago está marcado como pagado y tiene un proyecto asociado
            if ($pago->estado === 'pagado' && $pago->proyecto_id) {
                // Crear un gasto general en el proyecto
                $gasto = $pago->proyecto->gastosGenerales()->create([
                    'descripcion' => "Pago de nómina - {$pago->nombre_receptor}",
                    'monto' => $pago->monto,
                    'fecha' => $pago->fecha_pago,
                    'tipo' => 'operativo',
                    'pago_nomina_id' => $pago->id
                ]);
            }
        });

        static::deleted(function ($pago) {
            if ($pago->nominaSemanal) {
                $pago->nominaSemanal->actualizarTotales();
            }

            // Si el pago tenía un gasto general asociado, eliminarlo
            if ($pago->proyecto_id) {
                $pago->proyecto->gastosGenerales()
                    ->where('pago_nomina_id', $pago->id)
                    ->delete();
            }
        });
    }
}
