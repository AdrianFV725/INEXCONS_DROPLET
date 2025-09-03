<?php

namespace App\Http\Controllers;

use App\Models\NominaSemanal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Carbon\Carbon;

class NominaSemanalController extends Controller
{
    /**
     * Obtener todas las nóminas semanales.
     */
    public function index(Request $request)
    {
        try {
            $anio = $request->query('anio', date('Y'));
            $nominas = NominaSemanal::where('anio', $anio)
                ->orderBy('numero_semana')
                ->get();

            return response()->json($nominas);
        } catch (\Exception $e) {
            Log::error("Error al obtener nóminas semanales: " . $e->getMessage());
            return response()->json(['error' => 'Error al obtener las nóminas semanales'], 500);
        }
    }

    /**
     * Obtener una nómina semanal específica con sus pagos.
     */
    public function show($id)
    {
        try {
            $nomina = NominaSemanal::with(['pagos' => function ($query) {
                $query->with('trabajador')->orderBy('fecha_pago');
            }])->findOrFail($id);

            // Procesar los pagos para incluir el nombre del trabajador
            $nomina->pagos->each(function ($pago) {
                if ($pago->trabajador) {
                    $pago->nombre_receptor = $pago->trabajador->nombre . ' ' . $pago->trabajador->apellidos;
                }
            });

            return response()->json($nomina);
        } catch (\Exception $e) {
            Log::error("Error al obtener nómina semanal: " . $e->getMessage());
            return response()->json(['error' => 'Error al obtener la nómina semanal'], 500);
        }
    }

    /**
     * Actualizar una nómina semanal.
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'observaciones' => 'nullable|string',
                'cerrada' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $nomina = NominaSemanal::findOrFail($id);
            $nomina->update($request->only(['observaciones', 'cerrada']));

            return response()->json($nomina);
        } catch (\Exception $e) {
            Log::error("Error al actualizar nómina semanal: " . $e->getMessage());
            return response()->json(['error' => 'Error al actualizar la nómina semanal'], 500);
        }
    }

    /**
     * Generar todas las semanas para un año específico.
     */
    public function generarSemanas(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'anio' => 'required|integer|min:1980|max:2100',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $anio = $request->anio;

            // Verificar si ya existen semanas para ese año
            $semanasExistentes = NominaSemanal::where('anio', $anio)->count();
            if ($semanasExistentes > 0) {
                return response()->json(['message' => 'Ya existen semanas para este año'], 422);
            }

            // Obtener el primer día del año
            $firstDayOfYear = Carbon::createFromDate($anio, 1, 1);

            // Encontrar el primer lunes del año
            $firstMonday = $firstDayOfYear->copy()->startOfWeek(Carbon::MONDAY);

            // Si el primer lunes es del año anterior y el 1 de enero no es domingo,
            // avanzamos al primer lunes del año actual
            if ($firstMonday->year < $anio && $firstDayOfYear->dayOfWeek !== Carbon::SUNDAY) {
                $firstMonday->addWeek();
            }

            // Obtener el último día del año
            $lastDayOfYear = Carbon::createFromDate($anio, 12, 31);

            // Encontrar el último domingo
            $lastSunday = $lastDayOfYear->copy()->endOfWeek(Carbon::SUNDAY);

            // Si el último domingo es del año siguiente y el 31 de diciembre no es lunes,
            // retrocedemos al último domingo del año actual
            if ($lastSunday->year > $anio && $lastDayOfYear->dayOfWeek !== Carbon::MONDAY) {
                $lastSunday->subWeek();
            }

            $semanasCreadas = [];
            $numeroSemana = 1;
            $currentDate = $firstMonday->copy();

            while ($currentDate <= $lastSunday) {
                $inicioSemana = $currentDate->copy();
                $finSemana = $currentDate->copy()->addDays(6);

                // Log para debug
                Log::info("Generando Semana {$numeroSemana}: {$inicioSemana->toDateString()} - {$finSemana->toDateString()}");

                $nominaSemanal = NominaSemanal::create([
                    'anio' => $anio,
                    'numero_semana' => $numeroSemana,
                    'fecha_inicio' => $inicioSemana->format('Y-m-d'),
                    'fecha_fin' => $finSemana->format('Y-m-d'),
                    'total_pagado' => 0,
                    'total_pendiente' => 0,
                    'cerrada' => false,
                    'observaciones' => null
                ]);

                $semanasCreadas[] = $nominaSemanal;
                $numeroSemana++;
                $currentDate->addWeek();
            }

            Log::info("Se generaron " . count($semanasCreadas) . " semanas para el año {$anio}");

            return response()->json([
                'message' => 'Semanas generadas correctamente',
                'semanas' => $semanasCreadas,
                'total_semanas' => count($semanasCreadas)
            ], 201);
        } catch (\Exception $e) {
            Log::error("Error al generar semanas: " . $e->getMessage());
            return response()->json(['error' => 'Error al generar las semanas: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Obtener la nómina de la semana actual.
     */
    public function getSemanaActual()
    {
        try {
            // Usar Carbon para obtener la fecha actual
            $fechaActual = Carbon::now();
            $anioActual = $fechaActual->year;

            // Obtener el inicio de la semana actual (lunes)
            $inicioSemanaActual = $fechaActual->copy()->startOfWeek(Carbon::MONDAY);

            // Obtener el fin de la semana actual (domingo)
            $finSemanaActual = $inicioSemanaActual->copy()->addDays(6);

            Log::info("Calculando semana actual - Fecha actual: {$fechaActual->toDateString()}, Inicio: {$inicioSemanaActual->toDateString()}, Fin: {$finSemanaActual->toDateString()}");

            // Buscar la semana que corresponde exactamente a estas fechas
            $nomina = NominaSemanal::where('anio', $anioActual)
                ->where('fecha_inicio', '=', $inicioSemanaActual->format('Y-m-d'))
                ->where('fecha_fin', '=', $finSemanaActual->format('Y-m-d'))
                ->first();

            if ($nomina) {
                Log::info("Semana actual encontrada: Semana {$nomina->numero_semana} del {$nomina->anio}");
                return response()->json($nomina);
            }

            // Si no encontramos la semana exacta, buscamos por rango de fechas
            $nomina = NominaSemanal::where('anio', $anioActual)
                ->where('fecha_inicio', '<=', $fechaActual->toDateString())
                ->where('fecha_fin', '>=', $fechaActual->toDateString())
                ->first();

            if ($nomina) {
                Log::info("Semana encontrada por rango: Semana {$nomina->numero_semana} del {$nomina->anio}");
                return response()->json($nomina);
            }

            // Si no encontramos ninguna semana, buscamos la más cercana
            $nomina = NominaSemanal::where('anio', $anioActual)
                ->where('fecha_inicio', '>', $fechaActual->toDateString())
                ->orderBy('fecha_inicio', 'asc')
                ->first();

            if ($nomina) {
                Log::info("Semana más cercana encontrada (siguiente): Semana {$nomina->numero_semana} del {$nomina->anio}");
                return response()->json($nomina);
            }

            $nomina = NominaSemanal::where('anio', $anioActual)
                ->where('fecha_fin', '<', $fechaActual->toDateString())
                ->orderBy('fecha_fin', 'desc')
                ->first();

            if ($nomina) {
                Log::info("Semana más cercana encontrada (anterior): Semana {$nomina->numero_semana} del {$nomina->anio}");
                return response()->json($nomina);
            }

            // Si no hay semanas en el año actual, buscar en otros años
            $anioMasReciente = NominaSemanal::max('anio');
            if ($anioMasReciente) {
                $nomina = NominaSemanal::where('anio', $anioMasReciente)
                    ->orderBy('fecha_inicio', 'desc')
                    ->first();

                Log::info("Usando última semana del año más reciente: Semana {$nomina->numero_semana} del {$nomina->anio}");
                return response()->json($nomina);
            }

            Log::warning("No se encontró ninguna nómina semanal");
            return response()->json(['error' => 'No se encontró ninguna nómina semanal'], 404);
        } catch (\Exception $e) {
            Log::error("Error al obtener nómina de la semana actual: " . $e->getMessage());
            return response()->json(['error' => 'Error al obtener la nómina de la semana actual'], 500);
        }
    }

    /**
     * Obtener los años disponibles con nóminas semanales.
     */
    public function getAniosDisponibles()
    {
        try {
            $anios = NominaSemanal::distinct('anio')
                ->orderBy('anio', 'desc')
                ->pluck('anio');

            return response()->json($anios);
        } catch (\Exception $e) {
            Log::error("Error al obtener años disponibles: " . $e->getMessage());
            return response()->json(['error' => 'Error al obtener los años disponibles'], 500);
        }
    }

    /**
     * Eliminar todas las semanas de un año específico.
     */
    public function eliminarAnio(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'anio' => 'required|integer|min:1980|max:2100',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $anio = $request->anio;

            // Verificar si existen semanas para ese año
            $semanasExistentes = NominaSemanal::where('anio', $anio)->count();
            Log::info("Intentando eliminar año {$anio}. Semanas encontradas: {$semanasExistentes}");

            if ($semanasExistentes === 0) {
                Log::warning("No existen semanas para el año {$anio}");
                return response()->json(['error' => 'No existen semanas para este año'], 404);
            }

            // Obtener IDs de las semanas para log
            $idsNominas = NominaSemanal::where('anio', $anio)->pluck('id')->toArray();
            Log::info("IDs de nóminas a eliminar: " . implode(', ', $idsNominas));

            // Eliminar todas las semanas del año (la relación con pagos debe tener onDelete cascade)
            $eliminadas = NominaSemanal::where('anio', $anio)->delete();

            Log::info("Se eliminaron {$eliminadas} semanas del año {$anio}");

            return response()->json([
                'message' => "Se eliminaron {$eliminadas} semanas del año {$anio}",
                'eliminadas' => $eliminadas,
                'ids_eliminados' => $idsNominas
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar semanas del año: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al eliminar las semanas del año: ' . $e->getMessage()], 500);
        }
    }
}
