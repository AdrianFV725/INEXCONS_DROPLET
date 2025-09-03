<?php

namespace App\Http\Controllers;

use App\Models\Prospecto;
use App\Models\ProspectoHistorial;
use App\Models\Proyecto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ProspectoController extends Controller
{
    /**
     * Mostrar todos los prospectos.
     */
    public function index()
    {
        $prospectos = Prospecto::with('notas')->orderBy('created_at', 'desc')->get();
        return response()->json($prospectos);
    }

    /**
     * Almacenar un nuevo prospecto.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'cliente' => 'nullable|string|max:255',
            'ubicacion' => 'nullable|string|max:255',
            'presupuesto_estimado' => 'nullable|numeric',
            'fecha_estimada_inicio' => 'nullable|date',
            'estado' => 'nullable|in:pendiente,en_seguimiento,convertido,cancelado',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $prospecto = Prospecto::create($request->all());
        return response()->json($prospecto, 201);
    }

    /**
     * Mostrar un prospecto específico.
     */
    public function show($id)
    {
        $prospecto = Prospecto::with('notas')->findOrFail($id);
        return response()->json($prospecto);
    }

    /**
     * Actualizar un prospecto específico.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'cliente' => 'nullable|string|max:255',
            'ubicacion' => 'nullable|string|max:255',
            'presupuesto_estimado' => 'nullable|numeric',
            'fecha_estimada_inicio' => 'nullable|date',
            'estado' => 'nullable|in:pendiente,en_seguimiento,convertido,cancelado',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $prospecto = Prospecto::findOrFail($id);
        $prospecto->update($request->all());

        return response()->json($prospecto);
    }

    /**
     * Eliminar un prospecto específico.
     */
    public function destroy($id)
    {
        try {
            $prospecto = Prospecto::with('notas')->findOrFail($id);

            // Guardar en el historial antes de eliminar
            $historial = new ProspectoHistorial();
            $historial->fill($prospecto->toArray());
            $historial->fecha_eliminacion = now();

            // Guardar las notas como JSON
            $historial->notas = $prospecto->notas->toArray();
            $historial->save();

            Log::info('Prospecto guardado en historial: ' . $prospecto->nombre);

            // Eliminar el prospecto original
            $prospecto->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error al eliminar prospecto: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al eliminar el prospecto: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Actualizar el estado de un prospecto.
     */
    public function updateStatus($id, Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:pendiente,en_seguimiento,convertido,cancelado',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $prospecto = Prospecto::findOrFail($id);
            $prospecto->estado = $request->status;
            $prospecto->save();

            return response()->json($prospecto);
        } catch (\Exception $e) {
            Log::error('Error al actualizar estado del prospecto: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al actualizar el estado del prospecto: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Obtener estadísticas de prospectos.
     */
    public function getStats()
    {
        $stats = [
            'total' => Prospecto::count(),
            'pendientes' => Prospecto::where('estado', 'pendiente')->count(),
            'en_seguimiento' => Prospecto::where('estado', 'en_seguimiento')->count(),
            'convertidos' => Prospecto::where('estado', 'convertido')->count(),
            'cancelados' => Prospecto::where('estado', 'cancelado')->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Convertir un prospecto a proyecto.
     */
    public function convertToProject($id)
    {
        try {
            DB::beginTransaction();

            // Buscar el prospecto
            $prospecto = Prospecto::findOrFail($id);

            // Verificar si el prospecto está en estado 'convertido'
            if ($prospecto->estado !== 'convertido') {
                return response()->json([
                    'error' => 'El prospecto debe estar en estado "convertido" para poder convertirlo a proyecto'
                ], 400);
            }

            // Crear un nuevo proyecto
            $proyecto = new Proyecto();
            $proyecto->nombre = $prospecto->nombre;
            $proyecto->montoTotal = $prospecto->presupuesto_estimado ?: 0;
            $proyecto->iva = ($prospecto->presupuesto_estimado ?: 0) * 0.16; // IVA del 16%
            $proyecto->fechaInicio = $prospecto->fecha_estimada_inicio ?: now();
            $proyecto->fechaFinalizacion = date('Y-m-d', strtotime('+6 months', strtotime($proyecto->fechaInicio)));
            $proyecto->anticipo = ($prospecto->presupuesto_estimado ?: 0) * 0.30; // Anticipo del 30%
            $proyecto->save();

            // Almacenar el prospecto en el historial antes de eliminarlo
            $historial = new ProspectoHistorial();
            $historial->fill($prospecto->toArray());
            $historial->fecha_eliminacion = now();

            // Guardar las notas como JSON
            $historial->notas = $prospecto->notas->toArray();
            $historial->save();

            // Eliminar el prospecto original
            $prospecto->delete();

            DB::commit();

            return response()->json([
                'message' => 'Prospecto convertido a proyecto exitosamente',
                'projectId' => $proyecto->id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al convertir prospecto a proyecto: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'error' => 'Error al convertir el prospecto a proyecto: ' . $e->getMessage()
            ], 500);
        }
    }
}
