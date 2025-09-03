<?php

namespace App\Http\Controllers;

use App\Models\Proyecto;
use App\Models\Contratista;
use App\Models\Concepto;
use App\Models\Pago;
use App\Models\ProyectoHistorial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ProyectoController extends Controller
{
    public function index()
    {
        try {
            // Cargamos los proyectos con todos sus pagos, trabajadores y contratistas
            $proyectos = Proyecto::with([
                'pagos' => function ($query) {
                    // Ordenamos los pagos por fecha descendente
                    $query->orderBy('fecha', 'desc');
                },
                'trabajadores',
                'contratistas'
            ])->get();

            // Registramos los datos para depuración
            Log::info('Proyectos cargados con pagos:', [
                'cantidad_proyectos' => count($proyectos),
                'primer_proyecto_pagos' => $proyectos->first() ? count($proyectos->first()->pagos) : 0,
                'primer_proyecto_trabajadores' => $proyectos->first() ? count($proyectos->first()->trabajadores) : 0,
                'primer_proyecto_contratistas' => $proyectos->first() ? count($proyectos->first()->contratistas) : 0
            ]);

            return response()->json($proyectos);
        } catch (\Exception $e) {
            Log::error('Error al obtener los proyectos: ' . $e->getMessage(), [
                'exception' => $e
            ]);
            return response()->json(['error' => 'Error al obtener los proyectos: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'nombre' => 'required|string|max:255',
                'montoTotal' => 'required|numeric|min:0',
                'iva' => 'required|numeric|min:0',
                'fechaInicio' => 'required|date',
                'fechaFinalizacion' => 'required|date|after_or_equal:fechaInicio',
                'anticipo' => 'required|numeric|min:0'
            ]);

            $proyecto = Proyecto::create($validated);

            DB::commit();
            return response()->json($proyecto, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al crear el proyecto: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $proyecto = Proyecto::with([
                'pagos' => function ($query) {
                    $query->orderBy('fecha', 'desc');
                },
                'contratistas',
                'trabajadores'
            ])->findOrFail($id);

            // Registramos los datos para depuración
            Log::info('Proyecto cargado con pagos:', [
                'proyecto_id' => $id,
                'cantidad_pagos' => count($proyecto->pagos)
            ]);

            return response()->json($proyecto);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Proyecto no encontrado'], 404);
        } catch (\Exception $e) {
            Log::error('Error al obtener el proyecto: ' . $e->getMessage(), [
                'proyecto_id' => $id,
                'exception' => $e
            ]);
            return response()->json(['error' => 'Error al obtener el proyecto: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $proyecto = Proyecto::findOrFail($id);

            $validated = $request->validate([
                'nombre' => 'required|string|max:255',
                'montoTotal' => 'required|numeric|min:0',
                'iva' => 'required|numeric|min:0',
                'fechaInicio' => 'required|date',
                'fechaFinalizacion' => 'required|date|after_or_equal:fechaInicio',
                'anticipo' => 'required|numeric|min:0'
            ]);

            $proyecto->update($validated);

            // Actualizar contratistas si se proporcionan
            if ($request->has('contratistas')) {
                $contratistas = json_decode($request->contratistas, true);
                $proyecto->contratistas()->sync($contratistas);
            }

            DB::commit();
            return response()->json($proyecto->load(['pagos', 'contratistas']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al actualizar el proyecto: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            // Registrar información de depuración
            Log::info("Iniciando eliminación del proyecto ID: {$id}");

            $proyecto = Proyecto::with(['contratistas', 'trabajadores', 'conceptos.pagos'])->findOrFail($id);

            Log::info("Proyecto encontrado: {$proyecto->nombre}");
            Log::info("Contratistas asociados: " . $proyecto->contratistas->count());
            Log::info("Trabajadores asociados: " . $proyecto->trabajadores->count());
            Log::info("Conceptos asociados: " . $proyecto->conceptos->count());

            // Obtener los pagos del cliente
            $pagosCliente = DB::table('pagos')
                ->where('proyecto_id', $id)
                ->where('tipo', 'cliente')
                ->get();

            Log::info("Pagos de cliente encontrados: " . $pagosCliente->count());

            // Verificar si la tabla gastos_generales existe
            $gastosGenerales = collect();
            if (Schema::hasTable('gastos_generales')) {
                // Obtener los gastos generales
                $gastosGenerales = DB::table('gastos_generales')
                    ->where('proyecto_id', $id)
                    ->get();

                Log::info("Gastos generales encontrados: " . $gastosGenerales->count());
            } else {
                Log::info("La tabla gastos_generales no existe. Omitiendo esta parte.");
            }

            // Eliminar manualmente las relaciones para evitar problemas de integridad referencial
            Log::info("Eliminando pagos asociados a conceptos...");
            foreach ($proyecto->conceptos as $concepto) {
                $concepto->pagos()->delete();
            }

            Log::info("Eliminando conceptos...");
            $proyecto->conceptos()->delete();

            Log::info("Eliminando pagos directos del proyecto...");
            DB::table('pagos')
                ->where('proyecto_id', $id)
                ->delete();

            Log::info("Eliminando relaciones con contratistas...");
            $proyecto->contratistas()->detach();

            Log::info("Eliminando relaciones con trabajadores...");
            $proyecto->trabajadores()->detach();

            // Eliminar gastos generales solo si la tabla existe
            if (Schema::hasTable('gastos_generales')) {
                Log::info("Eliminando gastos generales...");
                DB::table('gastos_generales')
                    ->where('proyecto_id', $id)
                    ->delete();
            }

            // Crear el registro en el historial
            Log::info("Creando registro en historial...");
            ProyectoHistorial::create([
                'nombre' => $proyecto->nombre,
                'montoTotal' => $proyecto->montoTotal,
                'iva' => $proyecto->iva,
                'fechaInicio' => $proyecto->fechaInicio,
                'fechaFinalizacion' => $proyecto->fechaFinalizacion,
                'anticipo' => $proyecto->anticipo,
                'fecha_eliminacion' => now(),
                'contratistas' => $proyecto->contratistas->toJson(),
                'trabajadores' => $proyecto->trabajadores->toJson(),
                'pagos_cliente' => $pagosCliente->toJson(),
                'conceptos' => $proyecto->conceptos->toJson(),
                'gastos_generales' => $gastosGenerales->toJson()
            ]);

            Log::info("Eliminando el proyecto...");
            $proyecto->delete();

            DB::commit();
            Log::info("Proyecto eliminado exitosamente");
            return response()->json(null, 204);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error al eliminar el proyecto: " . $e->getMessage());
            Log::error("Trace: " . $e->getTraceAsString());
            return response()->json(['error' => 'Error al eliminar el proyecto: ' . $e->getMessage()], 500);
        }
    }

    public function addPayment(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $proyecto = Proyecto::findOrFail($id);

            $validated = $request->validate([
                'monto' => 'required|numeric|min:0',
                'fecha' => 'required|date',
                'descripcion' => 'required|string'
            ]);

            $pago = $proyecto->pagos()->create($validated);

            DB::commit();
            return response()->json($pago, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al registrar el pago: ' . $e->getMessage()], 500);
        }
    }

    public function updateContractors(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $proyecto = Proyecto::findOrFail($id);

            // Validar que contratistas sea un array
            $validated = $request->validate([
                'contratistas' => 'required|array'
            ]);

            // Sincronizar los contratistas
            $proyecto->contratistas()->sync($validated['contratistas']);

            DB::commit();

            // Retornar el proyecto con sus contratistas actualizados
            return response()->json($proyecto->load('contratistas'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al actualizar contratistas: ' . $e->getMessage(),
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTrace()
            ], 500);
        }
    }

    /**
     * Obtener todos los conceptos de un proyecto
     */
    public function getConceptos($id)
    {
        try {
            $proyecto = Proyecto::findOrFail($id);
            $conceptos = $proyecto->conceptos()->with(['contratista', 'pagos'])->get();

            return response()->json([
                'success' => true,
                'data' => $conceptos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los conceptos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener los conceptos de un contratista en un proyecto específico
     */
    public function getConceptosByContratista($proyectoId, $contratistaId)
    {
        try {
            $proyecto = Proyecto::findOrFail($proyectoId);
            $contratista = Contratista::findOrFail($contratistaId);

            // Verificar que el contratista esté asignado al proyecto
            $contratistaAsignado = $proyecto->contratistas()->where('contratista_id', $contratistaId)->exists();

            if (!$contratistaAsignado) {
                return response()->json([
                    'success' => false,
                    'message' => 'El contratista no está asignado a este proyecto'
                ], 422);
            }

            $conceptos = Concepto::where('proyecto_id', $proyectoId)
                ->where('contratista_id', $contratistaId)
                ->with(['pagos'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $conceptos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los conceptos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo concepto para un proyecto y contratista específicos
     */
    public function createConcepto(Request $request, $proyectoId, $contratistaId)
    {
        try {
            $proyecto = Proyecto::findOrFail($proyectoId);
            $contratista = Contratista::findOrFail($contratistaId);

            // Verificar que el contratista esté asignado al proyecto
            $contratistaAsignado = $proyecto->contratistas()->where('contratista_id', $contratistaId)->exists();

            if (!$contratistaAsignado) {
                return response()->json([
                    'success' => false,
                    'message' => 'El contratista no está asignado a este proyecto'
                ], 422);
            }

            $validated = $request->validate([
                'nombre' => 'required|string|max:255',
                'descripcion' => 'nullable|string',
                'monto_total' => 'required|numeric|min:0',
                'anticipo' => 'nullable|numeric|min:0',
            ]);

            $validated['contratista_id'] = $contratistaId;
            $validated['proyecto_id'] = $proyectoId;

            DB::beginTransaction();

            $concepto = Concepto::create($validated);

            // Si se proporcionó un anticipo, crear un pago de anticipo
            if (isset($validated['anticipo']) && $validated['anticipo'] > 0) {
                try {
                    $concepto->pagos()->create([
                        'monto' => $validated['anticipo'],
                        'fecha' => now(),
                        'descripcion' => 'Anticipo para el concepto: ' . $concepto->nombre,
                        'es_anticipo' => true,
                        'proyecto_id' => $proyectoId
                    ]);
                } catch (\Exception $e) {
                    Log::error('Error al crear pago de anticipo: ' . $e->getMessage());
                    throw $e;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Concepto creado exitosamente',
                'data' => $concepto->load(['pagos'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el concepto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todos los contratistas de un proyecto con sus conceptos
     */
    public function getContratistasWithConceptos($id)
    {
        try {
            $proyecto = Proyecto::findOrFail($id);
            $contratistas = $proyecto->contratistas()->get();

            $result = [];
            foreach ($contratistas as $contratista) {
                $conceptos = Concepto::where('proyecto_id', $id)
                    ->where('contratista_id', $contratista->id)
                    ->with(['pagos'])
                    ->get();

                $result[] = [
                    'contratista' => $contratista,
                    'conceptos' => $conceptos
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los contratistas con conceptos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de proyectos
     */
    public function stats()
    {
        try {
            Log::info('Iniciando stats en ProyectoController');

            $total = Proyecto::count();
            Log::info('Total de proyectos: ' . $total);

            $activos = Proyecto::where('fechaFinalizacion', '>=', now())->count();
            Log::info('Proyectos activos: ' . $activos);

            // Calcular montos totales incluyendo IVA
            $montoTotal = Proyecto::sum('montoTotal');
            $iva = Proyecto::sum('iva');
            $totalConIva = $montoTotal + $iva;
            Log::info('Monto total con IVA: ' . $totalConIva);

            // Calcular monto pendiente (montoTotal - pagos realizados)
            $pagosRealizados = DB::table('pagos')
                ->where('tipo', 'cliente')
                ->sum('monto');
            Log::info('Pagos realizados: ' . $pagosRealizados);

            $montoPendiente = $totalConIva - $pagosRealizados;
            Log::info('Monto pendiente: ' . $montoPendiente);

            // Obtener proyectos por mes (últimos 6 meses)
            $proyectosPorMes = DB::table('proyectos')
                ->select(DB::raw("strftime('%m', fechaInicio) as mes, strftime('%Y', fechaInicio) as año, COUNT(*) as total"))
                ->whereDate('fechaInicio', '>=', now()->subMonths(6))
                ->groupBy('año', 'mes')
                ->orderBy('año')
                ->orderBy('mes')
                ->get();
            Log::info('Proyectos por mes: ' . $proyectosPorMes->count());

            // Obtener pagos por mes (últimos 6 meses)
            $pagosPorMes = DB::table('pagos')
                ->select(DB::raw("strftime('%m', fecha) as mes, strftime('%Y', fecha) as año, SUM(monto) as total"))
                ->whereDate('fecha', '>=', now()->subMonths(6))
                ->groupBy('año', 'mes')
                ->orderBy('año')
                ->orderBy('mes')
                ->get();
            Log::info('Pagos por mes: ' . $pagosPorMes->count());

            // Calcular proyectos por estado
            $completados = Proyecto::where('estado', 'completado')->count();
            $pendientes = Proyecto::where('estado', 'pendiente')->count();
            $cancelados = Proyecto::where('estado', 'cancelado')->count();

            $response = [
                'total' => $total,
                'activos' => $activos,
                'montoTotal' => $montoTotal,
                'iva' => $iva,
                'totalConIva' => $totalConIva,
                'pagosRecibidos' => $pagosRealizados,
                'pagosPendientes' => $montoPendiente,
                'proyectosPorMes' => $proyectosPorMes,
                'pagosPorMes' => $pagosPorMes,
                'completados' => $completados,
                'pendientes' => $pendientes,
                'cancelados' => $cancelados
            ];

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Error en ProyectoController@stats: ' . $e->getMessage());
            return response()->json([
                'total' => 0,
                'activos' => 0,
                'montoTotal' => 0,
                'iva' => 0,
                'totalConIva' => 0,
                'pagosRecibidos' => 0,
                'pagosPendientes' => 0,
                'proyectosPorMes' => [],
                'pagosPorMes' => [],
                'completados' => 0,
                'pendientes' => 0,
                'cancelados' => 0
            ]);
        }
    }

    /**
     * Agregar un pago directo del cliente al proyecto
     */
    public function addClientePayment(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $proyecto = Proyecto::findOrFail($id);

            $validated = $request->validate([
                'monto' => 'required|numeric|min:0',
                'fecha' => 'required|date',
                'descripcion' => 'nullable|string'
            ]);

            // Agregar tipo 'cliente' al pago
            $validated['tipo'] = 'cliente';

            // Crear el pago directamente a través de la relación con el proyecto
            $pago = $proyecto->pagos()->create($validated);

            // Registramos el pago para depuración
            Log::info('Pago de cliente registrado:', [
                'proyecto_id' => $id,
                'pago_id' => $pago->id,
                'monto' => $pago->monto,
                'fecha' => $pago->fecha
            ]);

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Pago registrado correctamente',
                'data' => $pago
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al registrar el pago: ' . $e->getMessage(), [
                'proyecto_id' => $id,
                'request' => $request->all(),
                'exception' => $e
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el pago: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todos los pagos directos del cliente para un proyecto
     */
    public function getClientePayments($id)
    {
        try {
            $proyecto = Proyecto::findOrFail($id);

            // Obtener pagos directos del cliente (tipo = 'cliente')
            $pagos = Pago::where('proyecto_id', $id)
                ->where('tipo', 'cliente')
                ->orderBy('fecha', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Pagos del cliente obtenidos correctamente',
                'data' => $pagos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los pagos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener los gastos generales de un proyecto
     */
    public function getGastosGenerales($id)
    {
        try {
            $proyecto = Proyecto::findOrFail($id);

            $gastos = DB::table('gasto_generals')
                ->where('proyecto_id', $id)
                ->orderBy('fecha', 'desc')
                ->get();

            Log::info('Gastos generales obtenidos:', [
                'proyecto_id' => $id,
                'cantidad_gastos' => count($gastos)
            ]);

            return response()->json([
                'success' => true,
                'data' => $gastos
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener los gastos generales: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los gastos generales: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Agregar un gasto general al proyecto
     */
    public function addGastoGeneral(Request $request, $id)
    {
        try {
            $proyecto = Proyecto::findOrFail($id);

            $validated = $request->validate([
                'monto' => 'required|numeric|min:0',
                'fecha' => 'required|date',
                'descripcion' => 'required|string',
                'tipo' => 'required|in:operativo,administrativo,otros'
            ]);

            Log::info('Datos validados para nuevo gasto general:', $validated);

            $gasto = DB::table('gasto_generals')->insertGetId([
                'proyecto_id' => $id,
                'monto' => $validated['monto'],
                'fecha' => $validated['fecha'],
                'descripcion' => $validated['descripcion'],
                'tipo' => $validated['tipo'],
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $gastoCreado = DB::table('gasto_generals')->where('id', $gasto)->first();

            Log::info('Gasto general creado:', [
                'proyecto_id' => $id,
                'gasto_id' => $gasto
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Gasto general registrado correctamente',
                'data' => $gastoCreado
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error al registrar el gasto general: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el gasto general: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un gasto general
     */
    public function deleteGastoGeneral($proyectoId, $gastoId)
    {
        try {
            $proyecto = Proyecto::findOrFail($proyectoId);

            // Verificar que el gasto pertenezca al proyecto
            $gasto = DB::table('gasto_generals')
                ->where('id', $gastoId)
                ->where('proyecto_id', $proyectoId)
                ->first();

            if (!$gasto) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gasto general no encontrado'
                ], 404);
            }

            // Eliminar el gasto
            DB::table('gasto_generals')
                ->where('id', $gastoId)
                ->delete();

            Log::info('Gasto general eliminado:', [
                'proyecto_id' => $proyectoId,
                'gasto_id' => $gastoId
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Gasto general eliminado correctamente'
            ]);
        } catch (\Exception $e) {
            Log::error('Error al eliminar el gasto general: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el gasto general: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un pago directo del cliente
     */
    public function deleteClientePayment($proyectoId, $pagoId)
    {
        try {
            DB::beginTransaction();

            // Verificar que el proyecto exista
            $proyecto = Proyecto::findOrFail($proyectoId);

            // Buscar el pago específico que pertenezca al proyecto y sea de tipo cliente
            $pago = Pago::where('id', $pagoId)
                ->where('proyecto_id', $proyectoId)
                ->where('tipo', 'cliente')
                ->firstOrFail();

            // Registrar la eliminación para depuración
            Log::info('Eliminando pago de cliente:', [
                'proyecto_id' => $proyectoId,
                'pago_id' => $pagoId,
                'monto' => $pago->monto,
                'fecha' => $pago->fecha
            ]);

            // Eliminar el pago
            $pago->delete();

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Pago eliminado correctamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            Log::error('Pago o proyecto no encontrado:', [
                'proyecto_id' => $proyectoId,
                'pago_id' => $pagoId,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Pago o proyecto no encontrado'
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al eliminar el pago:', [
                'proyecto_id' => $proyectoId,
                'pago_id' => $pagoId,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el pago: ' . $e->getMessage()
            ], 500);
        }
    }
}
