<?php

namespace App\Http\Controllers;

use App\Models\Prospecto;
use App\Models\ProspectoNota;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProspectoNotaController extends Controller
{
    /**
     * Mostrar todas las notas de un prospecto.
     */
    public function index($prospectoId)
    {
        $prospecto = Prospecto::findOrFail($prospectoId);
        $notas = $prospecto->notas()->orderBy('created_at', 'desc')->get();

        return response()->json($notas);
    }

    /**
     * Almacenar una nueva nota para un prospecto.
     */
    public function store(Request $request, $prospectoId)
    {
        $prospecto = Prospecto::findOrFail($prospectoId);

        $validator = Validator::make($request->all(), [
            'contenido' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $nota = $prospecto->notas()->create([
            'contenido' => $request->contenido,
        ]);

        return response()->json($nota, 201);
    }

    /**
     * Mostrar una nota específica.
     */
    public function show($prospectoId, $notaId)
    {
        $prospecto = Prospecto::findOrFail($prospectoId);
        $nota = $prospecto->notas()->findOrFail($notaId);

        return response()->json($nota);
    }

    /**
     * Actualizar una nota específica.
     */
    public function update(Request $request, $prospectoId, $notaId)
    {
        $prospecto = Prospecto::findOrFail($prospectoId);
        $nota = $prospecto->notas()->findOrFail($notaId);

        $validator = Validator::make($request->all(), [
            'contenido' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $nota->update([
            'contenido' => $request->contenido,
        ]);

        return response()->json($nota);
    }

    /**
     * Eliminar una nota específica.
     */
    public function destroy($prospectoId, $notaId)
    {
        $prospecto = Prospecto::findOrFail($prospectoId);
        $nota = $prospecto->notas()->findOrFail($notaId);

        $nota->delete();

        return response()->json(null, 204);
    }
}
