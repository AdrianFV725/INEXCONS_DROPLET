<?php

namespace App\Http\Controllers;

use App\Models\Trabajador;
use App\Models\Proyecto;
use App\Models\PagoTrabajador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class TrabajadorController extends Controller
{
    /**
     * Obtener todos los trabajadores
     */
    public function index()
    {
        $trabajadores = Trabajador::with('proyectos')->get();
        return response()->json($trabajadores);
    }

    /**
     * Crear un nuevo trabajador
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'fecha_contratacion' => 'required|date',
            'sueldo_base' => 'required|numeric|min:0',
            'telefono' => 'nullable|string|max:20',
            'rfc' => 'nullable|string|max:13',
            'ine_documento' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'proyecto_id' => 'nullable|exists:proyectos,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $trabajadorData = [
                'nombre' => $request->nombre,
                'apellidos' => $request->apellidos,
                'fecha_contratacion' => $request->fecha_contratacion,
                'sueldo_base' => $request->sueldo_base,
                'telefono' => $request->telefono,
                'rfc' => $request->rfc,
            ];

            // Procesar el documento INE si se ha subido
            if ($request->hasFile('ine_documento')) {
                $file = $request->file('ine_documento');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('documentos/ine', $fileName, 'public');
                $trabajadorData['ine'] = $filePath;
            }

            $trabajador = Trabajador::create($trabajadorData);

            // Si se proporciona un proyecto, asignar el trabajador a ese proyecto
            if ($request->has('proyecto_id') && $request->proyecto_id) {
                $proyecto = Proyecto::findOrFail($request->proyecto_id);
                $trabajador->proyectos()->attach($proyecto->id, [
                    'fecha_asignacion' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            DB::commit();
            return response()->json($trabajador, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al crear el trabajador',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Obtener un trabajador específico
     */
    public function show($id)
    {
        $trabajador = Trabajador::with(['proyectos', 'pagos'])->findOrFail($id);

        // Añadir URL completa para el documento INE si existe
        if ($trabajador->ine) {
            $trabajador->ine_url = Storage::url($trabajador->ine);
        }

        return response()->json($trabajador);
    }

    /**
     * Actualizar un trabajador
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:255',
            'apellidos' => 'sometimes|required|string|max:255',
            'fecha_contratacion' => 'sometimes|required|date',
            'sueldo_base' => 'sometimes|required|numeric|min:0',
            'telefono' => 'nullable|string|max:20',
            'rfc' => 'nullable|string|max:13',
            'ine_documento' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $trabajador = Trabajador::findOrFail($id);

            $trabajadorData = [
                'nombre' => $request->nombre ?? $trabajador->nombre,
                'apellidos' => $request->apellidos ?? $trabajador->apellidos,
                'fecha_contratacion' => $request->fecha_contratacion ?? $trabajador->fecha_contratacion,
                'sueldo_base' => $request->sueldo_base ?? $trabajador->sueldo_base,
                'telefono' => $request->telefono,
                'rfc' => $request->rfc,
            ];

            // Procesar el documento INE si se ha subido
            if ($request->hasFile('ine_documento')) {
                $file = $request->file('ine_documento');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('documentos/ine', $fileName, 'public');
                $trabajadorData['ine'] = $filePath;
            }

            $trabajador->update($trabajadorData);
            return response()->json($trabajador);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar el trabajador',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un trabajador
     */
    public function destroy($id)
    {
        $trabajador = Trabajador::findOrFail($id);
        $trabajador->delete();

        return response()->json(null, 204);
    }

    /**
     * Asignar un trabajador a un proyecto
     */
    public function asignarProyecto(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'proyecto_id' => 'required|exists:proyectos,id',
            'fecha_asignacion' => 'nullable|date',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $trabajador = Trabajador::findOrFail($id);
            $proyecto = Proyecto::findOrFail($request->proyecto_id);

            // Verificar si ya está asignado a este proyecto
            if ($trabajador->proyectos()->where('proyecto_id', $proyecto->id)->exists()) {
                return response()->json(['message' => 'El trabajador ya está asignado a este proyecto'], 422);
            }

            $trabajador->proyectos()->attach($proyecto->id, [
                'fecha_asignacion' => $request->fecha_asignacion ?? now(),
                'observaciones' => $request->observaciones,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json(['message' => 'Trabajador asignado al proyecto correctamente']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al asignar el trabajador al proyecto',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Desasignar un trabajador de un proyecto
     */
    public function desasignarProyecto(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'proyecto_id' => 'required|exists:proyectos,id',
            'fecha_finalizacion' => 'nullable|date'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $trabajador = Trabajador::findOrFail($id);
            $proyecto = Proyecto::findOrFail($request->proyecto_id);

            // Verificar si está asignado a este proyecto
            if (!$trabajador->proyectos()->where('proyecto_id', $proyecto->id)->exists()) {
                return response()->json(['message' => 'El trabajador no está asignado a este proyecto'], 422);
            }

            // Si se proporciona fecha de finalización, actualizar el registro en la tabla pivote
            if ($request->has('fecha_finalizacion')) {
                $trabajador->proyectos()->updateExistingPivot($proyecto->id, [
                    'fecha_finalizacion' => $request->fecha_finalizacion,
                    'updated_at' => now()
                ]);
                return response()->json(['message' => 'Fecha de finalización actualizada correctamente']);
            } else {
                // Si no hay fecha de finalización, eliminar la relación
                $trabajador->proyectos()->detach($proyecto->id);
                return response()->json(['message' => 'Trabajador desasignado del proyecto correctamente']);
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al desasignar el trabajador del proyecto',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Registrar un pago a un trabajador
     */
    public function registrarPago(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'proyecto_id' => 'nullable|exists:proyectos,id',
            'monto' => 'required|numeric|min:0',
            'descripcion' => 'nullable|string',
            'fecha_pago' => 'required|date',
            'semana' => 'nullable|integer|min:1|max:53',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $trabajador = Trabajador::findOrFail($id);

        $pago = new PagoTrabajador([
            'trabajador_id' => $trabajador->id,
            'proyecto_id' => $request->proyecto_id,
            'monto' => $request->monto,
            'descripcion' => $request->descripcion,
            'fecha_pago' => $request->fecha_pago,
            'semana' => $request->semana,
            'observaciones' => $request->observaciones
        ]);

        $pago->save();

        return response()->json($pago, 201);
    }

    /**
     * Obtener los pagos de un trabajador
     */
    public function pagos($id)
    {
        $trabajador = Trabajador::findOrFail($id);
        $pagos = $trabajador->pagos()->with('proyecto')->get();

        return response()->json($pagos);
    }

    /**
     * Eliminar un pago de un trabajador
     */
    public function eliminarPago($id, $pagoId)
    {
        $trabajador = Trabajador::findOrFail($id);
        $pago = $trabajador->pagos()->findOrFail($pagoId);

        $pago->delete();

        return response()->json(['message' => 'Pago eliminado correctamente']);
    }

    /**
     * Obtener los proyectos de un trabajador
     */
    public function proyectos($id)
    {
        $trabajador = Trabajador::findOrFail($id);
        $proyectos = $trabajador->proyectos;

        return response()->json($proyectos);
    }

    /**
     * Obtener estadísticas de trabajadores
     */
    public function stats()
    {
        try {
            Log::info('Iniciando stats en TrabajadorController');

            $total = Trabajador::count();
            Log::info('Total de trabajadores: ' . $total);

            $sueldoPromedio = Trabajador::avg('sueldo_base') ?: 0;
            Log::info('Sueldo promedio: ' . $sueldoPromedio);

            $sueldoTotal = Trabajador::sum('sueldo_base') ?: 0;
            Log::info('Sueldo total: ' . $sueldoTotal);

            // Trabajadores por proyecto
            $trabajadoresPorProyecto = DB::table('proyecto_trabajador')
                ->join('proyectos', 'proyecto_trabajador.proyecto_id', '=', 'proyectos.id')
                ->select('proyectos.nombre', DB::raw('COUNT(trabajador_id) as total'))
                ->groupBy('proyectos.id', 'proyectos.nombre')
                ->orderBy('total', 'desc')
                ->get();
            Log::info('Trabajadores por proyecto: ' . $trabajadoresPorProyecto->count());

            // Trabajadores contratados por mes (últimos 6 meses)
            $contratacionesPorMes = DB::table('trabajadors')
                ->select(DB::raw("strftime('%m', fecha_contratacion) as mes, strftime('%Y', fecha_contratacion) as año, COUNT(*) as total"))
                ->whereDate('fecha_contratacion', '>=', now()->subMonths(6))
                ->groupBy('año', 'mes')
                ->orderBy('año')
                ->orderBy('mes')
                ->get();
            Log::info('Contrataciones por mes: ' . $contratacionesPorMes->count());

            // Pagos a trabajadores por mes (últimos 6 meses)
            $pagosPorMes = DB::table('pago_trabajadors')
                ->select(DB::raw("strftime('%m', fecha_pago) as mes, strftime('%Y', fecha_pago) as año, SUM(monto) as total"))
                ->whereDate('fecha_pago', '>=', now()->subMonths(6))
                ->groupBy('año', 'mes')
                ->orderBy('año')
                ->orderBy('mes')
                ->get();
            Log::info('Pagos por mes: ' . $pagosPorMes->count());

            $response = [
                'total' => $total,
                'sueldoPromedio' => $sueldoPromedio,
                'sueldoTotal' => $sueldoTotal,
                'trabajadoresPorProyecto' => $trabajadoresPorProyecto,
                'contratacionesPorMes' => $contratacionesPorMes,
                'pagosPorMes' => $pagosPorMes
            ];

            Log::info('Respuesta de stats en TrabajadorController: ' . json_encode($response));

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Error en TrabajadorController@stats: ' . $e->getMessage());
            Log::error('Trace: ' . $e->getTraceAsString());

            // Devolver valores vacíos en caso de error
            return response()->json([
                'total' => 0,
                'sueldoPromedio' => 0,
                'sueldoTotal' => 0,
                'trabajadoresPorProyecto' => [],
                'contratacionesPorMes' => [],
                'pagosPorMes' => []
            ], 500);
        }
    }
}
