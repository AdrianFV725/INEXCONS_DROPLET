<?php

namespace App\Http\Controllers;

use App\Models\Concepto;
use App\Models\Pago;
use App\Models\Proyecto;
use App\Models\Contratista;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ConceptoController extends Controller
{
    /**
     * Obtener todos los conceptos
     */
    public function index(Request $request)
    {
        $query = Concepto::with(['proyecto', 'contratista']);

        // Filtrar por proyecto si se proporciona
        if ($request->has('proyecto_id')) {
            $query->where('proyecto_id', $request->proyecto_id);
        }

        // Filtrar por contratista si se proporciona
        if ($request->has('contratista_id')) {
            $query->where('contratista_id', $request->contratista_id);
        }

        $conceptos = $query->get();

        return response()->json([
            'success' => true,
            'data' => $conceptos
        ]);
    }

    /**
     * Crear un nuevo concepto
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'monto_total' => 'required|numeric|min:0',
            'anticipo' => 'nullable|numeric|min:0',
            'proyecto_id' => 'required|exists:proyectos,id',
            'contratista_id' => 'required|exists:contratistas,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Verificar que el contratista esté asignado al proyecto
        $proyecto = Proyecto::find($request->proyecto_id);
        $contratistaAsignado = $proyecto->contratistas()->where('contratista_id', $request->contratista_id)->exists();

        if (!$contratistaAsignado) {
            return response()->json([
                'success' => false,
                'message' => 'El contratista no está asignado a este proyecto'
            ], 422);
        }

        $concepto = Concepto::create($request->all());

        // Si se proporcionó un anticipo, crear un pago de anticipo
        if ($request->has('anticipo') && $request->anticipo > 0) {
            Pago::create([
                'concepto_id' => $concepto->id,
                'proyecto_id' => $request->proyecto_id,
                'monto' => $request->anticipo,
                'fecha' => now(),
                'descripcion' => 'Anticipo para el concepto: ' . $concepto->nombre,
                'es_anticipo' => true
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Concepto creado exitosamente',
            'data' => $concepto->load(['proyecto', 'contratista'])
        ], 201);
    }

    /**
     * Obtener un concepto específico con sus pagos
     */
    public function show($id)
    {
        $concepto = Concepto::with(['proyecto', 'contratista', 'pagos'])->find($id);

        if (!$concepto) {
            return response()->json([
                'success' => false,
                'message' => 'Concepto no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $concepto
        ]);
    }

    /**
     * Actualizar un concepto
     */
    public function update(Request $request, $id)
    {
        $concepto = Concepto::find($id);

        if (!$concepto) {
            return response()->json([
                'success' => false,
                'message' => 'Concepto no encontrado'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'monto_total' => 'sometimes|required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $concepto->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Concepto actualizado exitosamente',
            'data' => $concepto->load(['proyecto', 'contratista'])
        ]);
    }

    /**
     * Eliminar un concepto
     */
    public function destroy($id)
    {
        $concepto = Concepto::find($id);

        if (!$concepto) {
            return response()->json([
                'success' => false,
                'message' => 'Concepto no encontrado'
            ], 404);
        }

        $concepto->delete();

        return response()->json([
            'success' => true,
            'message' => 'Concepto eliminado exitosamente'
        ]);
    }

    /**
     * Agregar un pago a un concepto
     */
    public function addPayment(Request $request, $id)
    {
        $concepto = Concepto::find($id);

        if (!$concepto) {
            return response()->json([
                'success' => false,
                'message' => 'Concepto no encontrado'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'monto' => 'required|numeric|min:0',
            'fecha' => 'required|date',
            'descripcion' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $pago = new Pago([
            'monto' => $request->monto,
            'fecha' => $request->fecha,
            'descripcion' => $request->descripcion,
            'es_anticipo' => false,
            'proyecto_id' => $concepto->proyecto_id
        ]);

        $concepto->pagos()->save($pago);

        return response()->json([
            'success' => true,
            'message' => 'Pago agregado exitosamente',
            'data' => $pago
        ], 201);
    }

    /**
     * Obtener todos los pagos de un concepto
     */
    public function getPayments($id)
    {
        $concepto = Concepto::find($id);

        if (!$concepto) {
            return response()->json([
                'success' => false,
                'message' => 'Concepto no encontrado'
            ], 404);
        }

        $pagos = $concepto->pagos;

        return response()->json([
            'success' => true,
            'data' => $pagos
        ]);
    }

    /**
     * Eliminar un pago específico de un concepto
     */
    public function deletePayment($conceptoId, $pagoId)
    {
        try {
            $concepto = Concepto::find($conceptoId);

            if (!$concepto) {
                return response()->json([
                    'success' => false,
                    'message' => 'Concepto no encontrado'
                ], 404);
            }

            // Buscar el pago específico que pertenezca al concepto
            $pago = Pago::where('id', $pagoId)
                ->where('concepto_id', $conceptoId)
                ->first();

            if (!$pago) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pago no encontrado o no pertenece a este concepto'
                ], 404);
            }

            // Eliminar el pago
            $pago->delete();

            return response()->json([
                'success' => true,
                'message' => 'Pago eliminado correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el pago: ' . $e->getMessage()
            ], 500);
        }
    }
}
