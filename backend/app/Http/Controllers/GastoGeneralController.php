<?php

namespace App\Http\Controllers;

use App\Models\GastoGeneral;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class GastoGeneralController extends Controller
{
    /**
     * Obtener todos los gastos generales con filtros opcionales
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            Log::info('Obteniendo gastos generales');

            $query = GastoGeneral::query();

            // Filtrar por fecha inicio y fin
            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
            }

            // Filtrar por descripción
            if ($request->has('descripcion')) {
                $query->where('descripcion', 'like', '%' . $request->descripcion . '%');
            }

            // Ordenar por fecha descendente por defecto
            $query->orderBy('fecha', 'desc');

            $gastos = $query->get();

            return response()->json($gastos);
        } catch (\Exception $e) {
            Log::error('Error al obtener gastos generales: ' . $e->getMessage());
            return response()->json(['error' => 'Error al obtener gastos generales: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Crear un nuevo gasto general
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            Log::info('Creando nuevo gasto general');

            $validator = Validator::make($request->all(), [
                'descripcion' => 'required|string|max:255',
                'monto' => 'required|numeric|min:0',
                'fecha' => 'required|date',
                'tipo' => 'required|in:operativo,administrativo,otros'
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()], 422);
            }

            $gasto = GastoGeneral::create([
                'descripcion' => $request->descripcion,
                'monto' => $request->monto,
                'fecha' => $request->fecha,
                'tipo' => $request->tipo
            ]);

            return response()->json($gasto, 201);
        } catch (\Exception $e) {
            Log::error('Error al crear gasto general: ' . $e->getMessage());
            return response()->json(['error' => 'Error al crear gasto general: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Obtener un gasto general específico
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            Log::info('Obteniendo gasto general con ID: ' . $id);

            $gasto = GastoGeneral::findOrFail($id);

            return response()->json($gasto);
        } catch (\Exception $e) {
            Log::error('Error al obtener gasto general: ' . $e->getMessage());
            return response()->json(['error' => 'Error al obtener gasto general: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Actualizar un gasto general
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            Log::info('Actualizando gasto general con ID: ' . $id);

            $validator = Validator::make($request->all(), [
                'descripcion' => 'required|string|max:255',
                'monto' => 'required|numeric|min:0',
                'fecha' => 'required|date',
                'tipo' => 'required|in:operativo,administrativo,otros'
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()], 422);
            }

            $gasto = GastoGeneral::findOrFail($id);

            $gasto->update([
                'descripcion' => $request->descripcion,
                'monto' => $request->monto,
                'fecha' => $request->fecha,
                'tipo' => $request->tipo
            ]);

            return response()->json($gasto);
        } catch (\Exception $e) {
            Log::error('Error al actualizar gasto general: ' . $e->getMessage());
            return response()->json(['error' => 'Error al actualizar gasto general: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Eliminar un gasto general
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            Log::info('Eliminando gasto general con ID: ' . $id);

            $gasto = GastoGeneral::findOrFail($id);
            $gasto->delete();

            return response()->json([
                'success' => true,
                'message' => 'Gasto general eliminado correctamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Gasto general no encontrado: ' . $id);
            return response()->json([
                'success' => false,
                'message' => 'Gasto general no encontrado'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error al eliminar gasto general: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar gasto general: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de gastos generales
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function stats()
    {
        try {
            Log::info('Iniciando cálculo de estadísticas de gastos generales');

            // Total de gastos generales (incluyendo INEX)
            $totalGastos = GastoGeneral::count();

            // Gastos de INEX (sin proyecto asociado)
            $gastosInex = DB::table('gasto_generals')
                ->whereNull('proyecto_id')
                ->sum('monto') ?? 0;

            // Gastos de proyectos
            $gastosProyectos = DB::table('gasto_generals')
                ->whereNotNull('proyecto_id')
                ->sum('monto') ?? 0;

            // Monto total de gastos (suma de gastos INEX y gastos de proyectos)
            $montoTotal = $gastosInex + $gastosProyectos;

            // Gastos por tipo (solo de proyectos)
            $gastosOperativos = GastoGeneral::where('tipo', 'operativo')
                ->whereNotNull('proyecto_id')
                ->sum('monto') ?? 0;
            $gastosAdministrativos = GastoGeneral::where('tipo', 'administrativo')
                ->whereNotNull('proyecto_id')
                ->sum('monto') ?? 0;
            $gastosOtros = GastoGeneral::where('tipo', 'otros')
                ->whereNotNull('proyecto_id')
                ->sum('monto') ?? 0;

            // Gastos de contratistas (desde la tabla conceptos y pagos)
            $totalGastosContratistas = DB::table('conceptos')
                ->join('pagos', 'conceptos.id', '=', 'pagos.concepto_id')
                ->sum('pagos.monto') ?? 0;

            // Gastos de INEX (sin proyecto asociado)
            $gastosInex = DB::table('gasto_generals')
                ->whereNull('proyecto_id')
                ->sum('monto') ?? 0;

            // Obtener monto total de proyectos y pagos recibidos
            $montoTotalProyectos = DB::table('proyectos')->sum('montoTotal') ?? 0;
            $totalPagos = DB::table('pagos')
                ->where('tipo', 'cliente')
                ->sum('monto') ?? 0;

            // Calcular saldo pendiente y balance final
            $saldoPendiente = $montoTotalProyectos - $totalPagos;
            $balanceFinal = $totalPagos - ($totalGastosContratistas + $montoTotal);

            // Gastos por mes (incluyendo INEX y proyectos)
            $gastosPorMes = DB::table('gasto_generals')
                ->select(DB::raw("strftime('%m', fecha) as mes, strftime('%Y', fecha) as año, SUM(monto) as total"))
                ->groupBy('año', 'mes')
                ->orderBy('año', 'desc')
                ->orderBy('mes', 'desc')
                ->get();

            Log::info('Estadísticas calculadas:', [
                'Total Gastos' => $montoTotal,
                'Gastos Operativos' => $gastosOperativos,
                'Gastos Administrativos' => $gastosAdministrativos,
                'Gastos Otros' => $gastosOtros,
                'Gastos INEX' => $gastosInex,
                'Gastos Proyectos' => $gastosProyectos,
                'Total Gastos Contratistas' => $totalGastosContratistas,
                'Total Pagos Cliente' => $totalPagos,
                'Balance Final' => $balanceFinal
            ]);

            return response()->json([
                'total_gastos' => $totalGastos,
                'monto_total_gastos' => $montoTotal,
                'gastos_por_mes' => $gastosPorMes,
                'monto_total_proyectos' => $montoTotalProyectos,
                'total_pagos' => $totalPagos,
                'total_gastos_contratistas' => $totalGastosContratistas,
                'operativos' => $gastosOperativos,
                'administrativos' => $gastosAdministrativos,
                'otros' => $gastosOtros,
                'gastos_inex' => $gastosInex,
                'gastos_proyectos' => $gastosProyectos,
                'saldo_pendiente' => $saldoPendiente,
                'balance_final' => $balanceFinal
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener estadísticas de gastos generales: ' . $e->getMessage());
            return response()->json([
                'total_gastos' => 0,
                'monto_total_gastos' => 0,
                'gastos_por_mes' => [],
                'monto_total_proyectos' => 0,
                'total_pagos' => 0,
                'total_gastos_contratistas' => 0,
                'operativos' => 0,
                'administrativos' => 0,
                'otros' => 0,
                'gastos_inex' => 0,
                'gastos_proyectos' => 0,
                'saldo_pendiente' => 0,
                'balance_final' => 0
            ]);
        }
    }

    /**
     * Obtener todos los gastos INEX (sin proyecto_id)
     */
    public function indexINEX()
    {
        try {
            $gastos = DB::table('gasto_generals')
                ->whereNull('proyecto_id')
                ->orderBy('fecha', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $gastos
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener gastos INEX: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener gastos INEX: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo gasto INEX
     */
    public function storeINEX(Request $request)
    {
        try {
            $validated = $request->validate([
                'monto' => 'required|numeric|min:0',
                'fecha' => 'required|date',
                'descripcion' => 'required|string',
                'tipo' => 'required|in:operativo,administrativo,otros'
            ]);

            $gasto = DB::table('gasto_generals')->insert([
                'proyecto_id' => null, // Gasto INEX
                'monto' => $validated['monto'],
                'fecha' => $validated['fecha'],
                'descripcion' => $validated['descripcion'],
                'tipo' => $validated['tipo'],
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Gasto INEX registrado correctamente',
                'data' => $gasto
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error al crear gasto INEX: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al crear gasto INEX: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un gasto INEX
     */
    public function destroyINEX($id)
    {
        try {
            $gasto = DB::table('gasto_generals')
                ->where('id', $id)
                ->whereNull('proyecto_id')
                ->first();

            if (!$gasto) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gasto INEX no encontrado'
                ], 404);
            }

            DB::table('gasto_generals')
                ->where('id', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Gasto INEX eliminado correctamente'
            ]);
        } catch (\Exception $e) {
            Log::error('Error al eliminar gasto INEX: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar gasto INEX: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de gastos
     */
    public function statsINEX()
    {
        try {
            // Contar total de gastos
            $totalGastos = DB::table('gasto_generals')->count();

            // Calcular gastos INEX (sin proyecto_id)
            $gastosInex = DB::table('gasto_generals')
                ->whereNull('proyecto_id')
                ->sum('monto') ?? 0;

            // Calcular gastos de proyectos
            $gastosProyectos = DB::table('gasto_generals')
                ->whereNotNull('proyecto_id')
                ->sum('monto') ?? 0;

            // Calcular gastos por mes
            $gastosPorMes = DB::table('gasto_generals')
                ->select(DB::raw("strftime('%m-%Y', fecha) as mes, SUM(monto) as total"))
                ->groupBy('mes')
                ->orderBy('mes', 'desc')
                ->limit(12)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_gastos' => $totalGastos,
                    'gastos_inex' => $gastosInex,
                    'gastos_proyectos' => $gastosProyectos,
                    'gastos_por_mes' => $gastosPorMes
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener estadísticas de gastos: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas de gastos: ' . $e->getMessage()
            ], 500);
        }
    }
}
