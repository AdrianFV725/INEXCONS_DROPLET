<?php

namespace App\Http\Controllers;

use App\Models\ProyectoHistorial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProyectoHistorialController extends Controller
{
    public function index(Request $request)
    {
        try {
            Log::info('Iniciando consulta de historial de proyectos');
            $query = ProyectoHistorial::query();

            // Filtrar por fechas
            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->whereBetween('fecha_eliminacion', [$request->fecha_inicio, $request->fecha_fin]);
            }

            // Filtrar por trabajador
            if ($request->has('trabajador_id')) {
                $trabajadorId = $request->trabajador_id;
                $query->whereRaw("JSON_SEARCH(trabajadores, 'one', ?, NULL, '$[*].id') IS NOT NULL", [$trabajadorId]);
            }

            // Buscar por nombre de proyecto
            if ($request->has('nombre')) {
                $query->where('nombre', 'like', '%' . $request->nombre . '%');
            }

            $proyectos = $query->orderBy('fecha_eliminacion', 'desc')->get();
            Log::info('Proyectos encontrados: ' . count($proyectos));

            return response()->json($proyectos);
        } catch (\Exception $e) {
            Log::error('Error al obtener el historial de proyectos: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al obtener el historial de proyectos: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            Log::info('Buscando proyecto en historial con ID: ' . $id);
            $proyecto = ProyectoHistorial::findOrFail($id);
            return response()->json($proyecto);
        } catch (\Exception $e) {
            Log::error('Error al obtener el proyecto del historial: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al obtener el proyecto del historial: ' . $e->getMessage()], 500);
        }
    }

    public function getStats()
    {
        try {
            Log::info('Iniciando obtención de estadísticas de historial de proyectos');

            // Verificar si la tabla existe
            if (!DB::getSchemaBuilder()->hasTable('proyecto_historials')) {
                Log::error('La tabla proyecto_historials no existe');
                return response()->json([
                    'proyectos_por_mes' => [],
                    'total_proyectos' => 0,
                    'monto_total' => 0
                ]);
            }

            // Obtener estadísticas de proyectos eliminados por mes
            // Usar funciones compatibles con SQLite
            $proyectosPorMes = DB::table('proyecto_historials')
                ->select(DB::raw("strftime('%m', fecha_eliminacion) as mes, strftime('%Y', fecha_eliminacion) as año, COUNT(*) as total"))
                ->groupBy('año', 'mes')
                ->orderBy('año', 'desc')
                ->orderBy('mes', 'desc')
                ->get();

            Log::info('Proyectos por mes: ' . count($proyectosPorMes));

            // Obtener el total de proyectos eliminados
            $totalProyectos = ProyectoHistorial::count();
            Log::info('Total de proyectos eliminados: ' . $totalProyectos);

            // Obtener el monto total de proyectos eliminados
            $montoTotal = ProyectoHistorial::sum('montoTotal');
            Log::info('Monto total de proyectos eliminados: ' . $montoTotal);

            $response = [
                'proyectos_por_mes' => $proyectosPorMes,
                'total_proyectos' => $totalProyectos,
                'monto_total' => $montoTotal
            ];

            Log::info('Respuesta de estadísticas de historial: ' . json_encode($response));

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Error al obtener estadísticas de historial: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al obtener estadísticas: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Elimina un registro del historial de proyectos
     *
     * @param int $id ID del proyecto en el historial
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            Log::info('Eliminando proyecto del historial con ID: ' . $id);
            $proyecto = ProyectoHistorial::findOrFail($id);
            $nombre = $proyecto->nombre;

            $proyecto->delete();

            Log::info('Proyecto eliminado del historial: ' . $nombre);
            return response()->json(['message' => 'Proyecto eliminado del historial correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al eliminar el proyecto del historial: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al eliminar el proyecto del historial: ' . $e->getMessage()], 500);
        }
    }
}
