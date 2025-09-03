<?php

namespace App\Http\Controllers;

use App\Models\PagoNomina;
use App\Models\NominaSemanal;
use App\Models\Trabajador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PagoNominaController extends Controller
{
    /**
     * Obtener todos los pagos de una nómina semanal específica.
     */
    public function index(Request $request, $nominaId)
    {
        try {
            $nomina = NominaSemanal::findOrFail($nominaId);
            $pagos = $nomina->pagos()
                ->with('trabajador')
                ->orderBy('fecha_pago')
                ->get();

            return response()->json($pagos);
        } catch (\Exception $e) {
            Log::error("Error al obtener pagos de nómina: " . $e->getMessage());
            return response()->json(['error' => 'Error al obtener los pagos de nómina'], 500);
        }
    }

    /**
     * Almacenar un nuevo pago de nómina.
     */
    public function store(Request $request, $nominaId)
    {
        try {
            $nomina = NominaSemanal::findOrFail($nominaId);

            // Validación de datos
            $validator = Validator::make($request->all(), [
                'trabajador_id' => 'nullable|exists:trabajadors,id',
                'nombre_receptor' => 'required_without:trabajador_id|nullable|string|max:255',
                'monto' => 'required|numeric|min:0',
                'fecha_pago' => 'required|date',
                'estado' => 'required|in:pendiente,pagado',
                'concepto' => 'nullable|string|max:255',
                'observaciones' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Si la nómina está cerrada, no permitir nuevos pagos
            if ($nomina->cerrada) {
                return response()->json(['error' => 'No se pueden agregar pagos a una nómina cerrada'], 422);
            }

            // Si se proporciona un trabajador_id, usar su nombre completo como nombre_receptor
            if ($request->trabajador_id) {
                $trabajador = Trabajador::findOrFail($request->trabajador_id);
                $request->merge(['nombre_receptor' => $trabajador->nombre . ' ' . $trabajador->apellidos]);

                // Obtener el proyecto activo del trabajador
                $proyectoActivo = $trabajador->proyectos()
                    ->whereNull('proyecto_trabajador.fecha_finalizacion')
                    ->first();

                if ($proyectoActivo) {
                    $request->merge(['proyecto_id' => $proyectoActivo->id]);
                }
            } elseif (!$request->nombre_receptor) {
                return response()->json(['error' => 'Debe proporcionar un trabajador o un nombre de receptor'], 422);
            }

            // Crear el pago
            $pago = new PagoNomina($request->all());
            $pago->nomina_semanal_id = $nominaId;
            $pago->save();

            // Cargar la relación con el trabajador
            $pago->load('trabajador');

            // Actualizar totales de la nómina
            $nomina->actualizarTotales();

            return response()->json($pago, 201);
        } catch (\Exception $e) {
            Log::error("Error al crear pago de nómina: " . $e->getMessage());
            return response()->json(['error' => 'Error al crear el pago de nómina: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Mostrar un pago de nómina específico.
     */
    public function show($nominaId, $pagoId)
    {
        try {
            $pago = PagoNomina::with('trabajador')
                ->where('nomina_semanal_id', $nominaId)
                ->findOrFail($pagoId);

            return response()->json($pago);
        } catch (\Exception $e) {
            Log::error("Error al obtener pago de nómina: " . $e->getMessage());
            return response()->json(['error' => 'Error al obtener el pago de nómina'], 500);
        }
    }

    /**
     * Actualizar un pago de nómina específico.
     */
    public function update(Request $request, $nominaId, $pagoId)
    {
        try {
            $nomina = NominaSemanal::findOrFail($nominaId);
            $pago = PagoNomina::where('nomina_semanal_id', $nominaId)
                ->findOrFail($pagoId);

            // Si la nómina está cerrada, no permitir actualizaciones
            if ($nomina->cerrada) {
                return response()->json(['error' => 'No se pueden actualizar pagos de una nómina cerrada'], 422);
            }

            // Validación de datos
            $validator = Validator::make($request->all(), [
                'trabajador_id' => 'nullable|exists:trabajadors,id',
                'nombre_receptor' => 'nullable|string|max:255',
                'monto' => 'numeric|min:0',
                'fecha_pago' => 'date',
                'estado' => 'in:pendiente,pagado',
                'concepto' => 'nullable|string|max:255',
                'observaciones' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Si se cambia el trabajador_id, actualizar nombre_receptor
            if (isset($request->trabajador_id) && $request->trabajador_id) {
                $trabajador = Trabajador::findOrFail($request->trabajador_id);
                $request->merge(['nombre_receptor' => $trabajador->nombre . ' ' . $trabajador->apellidos]);
            } elseif (isset($request->trabajador_id) && !$request->trabajador_id && !$request->nombre_receptor) {
                return response()->json(['error' => 'Debe proporcionar un trabajador o un nombre de receptor'], 422);
            }

            // Actualizar el pago
            $pago->update($request->all());

            // Cargar la relación con el trabajador
            $pago->load('trabajador');

            // Actualizar totales de la nómina
            $nomina->actualizarTotales();

            return response()->json($pago);
        } catch (\Exception $e) {
            Log::error("Error al actualizar pago de nómina: " . $e->getMessage());
            return response()->json(['error' => 'Error al actualizar el pago de nómina: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Eliminar un pago de nómina específico.
     */
    public function destroy($nominaId, $pagoId)
    {
        try {
            $nomina = NominaSemanal::findOrFail($nominaId);
            $pago = PagoNomina::where('nomina_semanal_id', $nominaId)
                ->findOrFail($pagoId);

            // Si la nómina está cerrada, no permitir eliminaciones
            if ($nomina->cerrada) {
                return response()->json(['error' => 'No se pueden eliminar pagos de una nómina cerrada'], 422);
            }

            $pago->delete();

            // Actualizar totales de la nómina
            $nomina->actualizarTotales();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error("Error al eliminar pago de nómina: " . $e->getMessage());
            return response()->json(['error' => 'Error al eliminar el pago de nómina'], 500);
        }
    }

    /**
     * Cambiar el estado de un pago (pendiente/pagado).
     */
    public function cambiarEstado(Request $request, $nominaId, $pagoId)
    {
        try {
            $nomina = NominaSemanal::findOrFail($nominaId);
            $pago = PagoNomina::where('nomina_semanal_id', $nominaId)
                ->findOrFail($pagoId);

            // Si la nómina está cerrada, no permitir cambios
            if ($nomina->cerrada) {
                return response()->json(['error' => 'No se pueden modificar pagos de una nómina cerrada'], 422);
            }

            $validator = Validator::make($request->all(), [
                'estado' => 'required|in:pendiente,pagado',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $pago->estado = $request->estado;
            $pago->save();

            // Actualizar totales de la nómina
            $nomina->actualizarTotales();

            return response()->json($pago);
        } catch (\Exception $e) {
            Log::error("Error al cambiar estado de pago: " . $e->getMessage());
            return response()->json(['error' => 'Error al cambiar el estado del pago'], 500);
        }
    }

    /**
     * Obtener todos los trabajadores para el selector de pagos.
     */
    public function getTrabajadores()
    {
        try {
            $trabajadores = Trabajador::select('id', 'nombre', 'apellidos', 'sueldo_base')
                ->orderBy('nombre')
                ->get()
                ->map(function ($trabajador) {
                    return [
                        'id' => $trabajador->id,
                        'nombre_completo' => $trabajador->nombre . ' ' . $trabajador->apellidos,
                        'sueldo_base' => $trabajador->sueldo_base
                    ];
                });

            return response()->json($trabajadores);
        } catch (\Exception $e) {
            Log::error("Error al obtener trabajadores: " . $e->getMessage());
            return response()->json(['error' => 'Error al obtener los trabajadores'], 500);
        }
    }
}
