<?php

namespace App\Http\Controllers;

use App\Models\ProspectoHistorial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProspectoHistorialController extends Controller
{
    /**
     * Mostrar todos los prospectos en el historial.
     */
    public function index(Request $request)
    {
        try {
            Log::info('Iniciando consulta de historial de prospectos');
            $query = ProspectoHistorial::query();

            // Filtrar por fechas
            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->whereBetween('fecha_eliminacion', [$request->fecha_inicio, $request->fecha_fin]);
            }

            // Buscar por nombre o cliente
            if ($request->has('busqueda')) {
                $busqueda = $request->busqueda;
                $query->where(function ($q) use ($busqueda) {
                    $q->where('nombre', 'like', '%' . $busqueda . '%')
                        ->orWhere('cliente', 'like', '%' . $busqueda . '%');
                });
            }

            // Filtrar por estado
            if ($request->has('estado') && $request->estado !== 'todos') {
                $query->where('estado', $request->estado);
            }

            $prospectos = $query->orderBy('fecha_eliminacion', 'desc')->get();
            Log::info('Prospectos encontrados en historial: ' . count($prospectos));

            return response()->json($prospectos);
        } catch (\Exception $e) {
            Log::error('Error al obtener el historial de prospectos: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al obtener el historial de prospectos: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Mostrar un prospecto específico del historial.
     */
    public function show($id)
    {
        try {
            Log::info('Buscando prospecto en historial con ID: ' . $id);
            $prospecto = ProspectoHistorial::findOrFail($id);
            return response()->json($prospecto);
        } catch (\Exception $e) {
            Log::error('Error al obtener el prospecto del historial: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al obtener el prospecto del historial: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Obtener estadísticas de prospectos en el historial.
     */
    public function getStats()
    {
        try {
            Log::info('Iniciando obtención de estadísticas de historial de prospectos');

            // Verificar si la tabla existe
            if (!DB::getSchemaBuilder()->hasTable('prospecto_historials')) {
                Log::error('La tabla prospecto_historials no existe');
                return response()->json([
                    'total_prospectos' => 0,
                    'monto_total_no_atendidos' => 0,
                    'por_estado' => [
                        'pendiente' => 0,
                        'en_seguimiento' => 0,
                        'convertido' => 0,
                        'cancelado' => 0
                    ]
                ]);
            }

            // Obtener el total de prospectos eliminados
            $totalProspectos = ProspectoHistorial::count();
            Log::info('Total de prospectos eliminados: ' . $totalProspectos);

            // Obtener el monto total de prospectos no atendidos (pendientes o en seguimiento)
            $montoTotalNoAtendidos = ProspectoHistorial::whereIn('estado', ['pendiente', 'en_seguimiento'])
                ->sum('presupuesto_estimado');
            Log::info('Monto total de prospectos no atendidos: ' . $montoTotalNoAtendidos);

            // Obtener conteo por estado
            $porEstado = [
                'pendiente' => ProspectoHistorial::where('estado', 'pendiente')->count(),
                'en_seguimiento' => ProspectoHistorial::where('estado', 'en_seguimiento')->count(),
                'convertido' => ProspectoHistorial::where('estado', 'convertido')->count(),
                'cancelado' => ProspectoHistorial::where('estado', 'cancelado')->count()
            ];

            $response = [
                'total_prospectos' => $totalProspectos,
                'monto_total_no_atendidos' => $montoTotalNoAtendidos,
                'por_estado' => $porEstado
            ];

            Log::info('Respuesta de estadísticas de historial de prospectos: ' . json_encode($response));

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Error al obtener estadísticas de historial de prospectos: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al obtener estadísticas: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Elimina un registro del historial de prospectos
     */
    public function destroy($id)
    {
        try {
            Log::info('Eliminando prospecto del historial con ID: ' . $id);
            $prospecto = ProspectoHistorial::findOrFail($id);
            $nombre = $prospecto->nombre;

            $prospecto->delete();

            Log::info('Prospecto eliminado del historial: ' . $nombre);
            return response()->json(['message' => 'Prospecto eliminado del historial correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al eliminar el prospecto del historial: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al eliminar el prospecto del historial: ' . $e->getMessage()], 500);
        }
    }
}
