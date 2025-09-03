<?php

namespace App\Http\Controllers;

use App\Models\Especialidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EspecialidadController extends Controller
{
    /**
     * Obtener todas las especialidades
     */
    public function index()
    {
        try {
            $especialidades = Especialidad::all();
            return response()->json($especialidades);
        } catch (\Exception $e) {
            Log::error('Error al obtener especialidades: ' . $e->getMessage());
            return response()->json(['error' => 'Error al obtener las especialidades: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Crear una nueva especialidad
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nombre' => 'required|string|max:255|unique:especialidades',
                'descripcion' => 'nullable|string',
            ]);

            $especialidad = Especialidad::create($validated);
            return response()->json($especialidad, 201);
        } catch (\Exception $e) {
            Log::error('Error al crear especialidad: ' . $e->getMessage());
            return response()->json(['error' => 'Error al crear la especialidad: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Obtener una especialidad específica
     */
    public function show($id)
    {
        try {
            $especialidad = Especialidad::findOrFail($id);
            return response()->json($especialidad);
        } catch (\Exception $e) {
            Log::error('Error al obtener especialidad: ' . $e->getMessage());
            return response()->json(['error' => 'Error al obtener la especialidad: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Actualizar una especialidad
     */
    public function update(Request $request, $id)
    {
        try {
            $especialidad = Especialidad::findOrFail($id);

            $validated = $request->validate([
                'nombre' => 'required|string|max:255|unique:especialidades,nombre,' . $id,
                'descripcion' => 'nullable|string',
            ]);

            $especialidad->update($validated);
            return response()->json($especialidad);
        } catch (\Exception $e) {
            Log::error('Error al actualizar especialidad: ' . $e->getMessage());
            return response()->json(['error' => 'Error al actualizar la especialidad: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Eliminar una especialidad
     */
    public function destroy($id)
    {
        try {
            $especialidad = Especialidad::findOrFail($id);

            // Verificar si hay contratistas usando esta especialidad
            $contratistasCount = $especialidad->contratistas()->count();
            if ($contratistasCount > 0) {
                return response()->json([
                    'error' => 'No se puede eliminar la especialidad porque está siendo utilizada por ' . $contratistasCount . ' contratista(s)'
                ], 400);
            }

            $especialidad->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error al eliminar especialidad: ' . $e->getMessage());
            return response()->json(['error' => 'Error al eliminar la especialidad: ' . $e->getMessage()], 500);
        }
    }
}
