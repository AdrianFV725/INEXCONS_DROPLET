<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProyectoController;
use App\Http\Controllers\ContratistaController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConceptoController;
use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\EspecialidadController;
use App\Http\Controllers\ProyectoHistorialController;
use App\Http\Controllers\GastoGeneralController;
use App\Http\Controllers\ProspectoController;
use App\Http\Controllers\ProspectoNotaController;
use App\Http\Controllers\ProspectoHistorialController;
use App\Http\Controllers\NominaSemanalController;
use App\Http\Controllers\PagoNominaController;
use App\Http\Controllers\FileManagerController;
use Illuminate\Support\Facades\Storage;

// Ruta de prueba
Route::get('/test', function () {
    return response()->json(['message' => 'API funcionando correctamente']);
});

// Rutas de autenticación
Route::post('/login', [AuthController::class, 'login']);
Route::post('/recuperar-password', [AuthController::class, 'recuperarPassword']);

// Rutas de especialidades (sin autenticación)
Route::prefix('especialidades')->group(function () {
    Route::get('/', [EspecialidadController::class, 'index']);
    Route::post('/', [EspecialidadController::class, 'store']);
    Route::get('/{id}', [EspecialidadController::class, 'show']);
    Route::put('/{id}', [EspecialidadController::class, 'update']);
    Route::delete('/{id}', [EspecialidadController::class, 'destroy']);
});

// Rutas de historial de proyectos (sin autenticación para pruebas)
Route::prefix('proyectos-historial')->group(function () {
    Route::get('/', [ProyectoHistorialController::class, 'index']);
    Route::get('/stats', [ProyectoHistorialController::class, 'getStats']);
    Route::get('/{id}', [ProyectoHistorialController::class, 'show']);
    Route::delete('/{id}', [ProyectoHistorialController::class, 'destroy']);
});

// Rutas de gastos generales (sin autenticación para pruebas)
Route::prefix('gastos-generales')->group(function () {
    Route::get('/', [GastoGeneralController::class, 'index']);
    Route::post('/', [GastoGeneralController::class, 'store']);
    Route::get('/stats', [GastoGeneralController::class, 'stats']);
    Route::get('/{id}', [GastoGeneralController::class, 'show']);
    Route::put('/{id}', [GastoGeneralController::class, 'update']);
    Route::delete('/{id}', [GastoGeneralController::class, 'destroy']);
});

// Rutas para gastos INEX
Route::prefix('gastos-inex')->group(function () {
    Route::get('/', [GastoGeneralController::class, 'indexINEX']);
    Route::post('/', [GastoGeneralController::class, 'storeINEX']);
    Route::delete('/{id}', [GastoGeneralController::class, 'destroyINEX']);
    Route::get('/stats', [GastoGeneralController::class, 'statsINEX']);
});

// Rutas de prospectos (sin autenticación para pruebas)
Route::prefix('prospectos')->group(function () {
    Route::get('/', [ProspectoController::class, 'index']);
    Route::post('/', [ProspectoController::class, 'store']);
    Route::get('/stats', [ProspectoController::class, 'getStats']);
    Route::get('/{id}', [ProspectoController::class, 'show']);
    Route::put('/{id}', [ProspectoController::class, 'update']);
    Route::delete('/{id}', [ProspectoController::class, 'destroy']);
    Route::post('/{id}/convert', [ProspectoController::class, 'convertToProject']);
    Route::put('/{id}/status', [ProspectoController::class, 'updateStatus']);

    // Rutas para notas de prospectos
    Route::get('/{prospectoId}/notas', [ProspectoNotaController::class, 'index']);
    Route::post('/{prospectoId}/notas', [ProspectoNotaController::class, 'store']);
    Route::get('/{prospectoId}/notas/{notaId}', [ProspectoNotaController::class, 'show']);
    Route::put('/{prospectoId}/notas/{notaId}', [ProspectoNotaController::class, 'update']);
    Route::delete('/{prospectoId}/notas/{notaId}', [ProspectoNotaController::class, 'destroy']);
});

// Rutas de historial de prospectos (sin autenticación para pruebas)
Route::prefix('prospectos-historial')->group(function () {
    Route::get('/', [ProspectoHistorialController::class, 'index']);
    Route::get('/stats', [ProspectoHistorialController::class, 'getStats']);
    Route::get('/{id}', [ProspectoHistorialController::class, 'show']);
    Route::delete('/{id}', [ProspectoHistorialController::class, 'destroy']);
});

// Rutas para la nómina semanal
Route::prefix('nomina-semanal')->group(function () {
    Route::get('/', [NominaSemanalController::class, 'index']);
    Route::get('/anios-disponibles', [NominaSemanalController::class, 'getAniosDisponibles']);
    Route::get('/semana-actual', [NominaSemanalController::class, 'getSemanaActual']);
    Route::post('/generar-semanas', [NominaSemanalController::class, 'generarSemanas']);
    Route::delete('/eliminar-anio', [NominaSemanalController::class, 'eliminarAnio']);
    Route::post('/eliminar-anio', [NominaSemanalController::class, 'eliminarAnio']);
    Route::get('/{id}', [NominaSemanalController::class, 'show']);
    Route::put('/{id}', [NominaSemanalController::class, 'update']);

    // Rutas para pagos de nómina
    Route::get('/{nominaId}/pagos', [PagoNominaController::class, 'index']);
    Route::post('/{nominaId}/pagos', [PagoNominaController::class, 'store']);
    Route::get('/{nominaId}/pagos/{pagoId}', [PagoNominaController::class, 'show']);
    Route::put('/{nominaId}/pagos/{pagoId}', [PagoNominaController::class, 'update']);
    Route::delete('/{nominaId}/pagos/{pagoId}', [PagoNominaController::class, 'destroy']);
    Route::put('/{nominaId}/pagos/{pagoId}/estado', [PagoNominaController::class, 'cambiarEstado']);
});

// Ruta para obtener trabajadores para el selector de nómina
Route::get('/trabajadores-nomina', [PagoNominaController::class, 'getTrabajadores']);

// Ruta para servir documentos directamente desde la API
Route::get('/documentos/ine/{filename}', function ($filename) {
    $path = 'documentos/ine/' . $filename;

    if (!Storage::disk('public')->exists($path)) {
        return response()->json(['error' => 'Documento no encontrado'], 404);
    }

    $file = Storage::disk('public')->get($path);
    $mimeType = Storage::disk('public')->mimeType($path) ?? 'application/octet-stream';

    return response($file)
        ->header('Content-Type', $mimeType)
        ->header('Content-Disposition', 'inline; filename="' . $filename . '"')
        ->header('Access-Control-Allow-Origin', '*');
});

// Rutas protegidas
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Rutas del gestor de archivos
    Route::prefix('file-manager')->group(function () {
        Route::get('folders/{folder?}', [FileManagerController::class, 'getFolderContents']);
        Route::post('folders', [FileManagerController::class, 'createFolder']);
        Route::put('folders/{folder}', [FileManagerController::class, 'updateFolder']);
        Route::delete('folders/{folder}', [FileManagerController::class, 'deleteFolder']);
        Route::post('files', [FileManagerController::class, 'uploadFile']);
        Route::get('files/{file}/download', [FileManagerController::class, 'downloadFile']);
        Route::delete('files/{file}', [FileManagerController::class, 'deleteFile']);
        Route::get('search', [FileManagerController::class, 'searchFiles']);
    });

    // Rutas de proyectos
    Route::prefix('proyectos')->group(function () {
        Route::get('/', [ProyectoController::class, 'index']);
        Route::post('/', [ProyectoController::class, 'store']);
        Route::get('/stats', [ProyectoController::class, 'stats']);
        Route::get('/{id}', [ProyectoController::class, 'show']);
        Route::put('/{id}', [ProyectoController::class, 'update']);
        Route::delete('/{id}', [ProyectoController::class, 'destroy']);
        Route::post('/{id}/pagos', [ProyectoController::class, 'addPayment']);
        Route::post('/{id}/pagos-cliente', [ProyectoController::class, 'addClientePayment']);
        Route::get('/{id}/pagos-cliente', [ProyectoController::class, 'getClientePayments']);
        Route::delete('/{id}/pagos-cliente/{pagoId}', [ProyectoController::class, 'deleteClientePayment']);
        Route::put('/{id}/contratistas', [ProyectoController::class, 'updateContractors']);

        // Rutas para gastos generales de proyectos
        Route::get('/{id}/gastos-generales', [ProyectoController::class, 'getGastosGenerales']);
        Route::post('/{id}/gastos-generales', [ProyectoController::class, 'addGastoGeneral']);
        Route::delete('/{id}/gastos-generales/{gastoId}', [ProyectoController::class, 'deleteGastoGeneral']);

        // Nuevas rutas para conceptos en proyectos
        Route::get('/{id}/conceptos', [ProyectoController::class, 'getConceptos']);
        Route::get('/{id}/contratistas-conceptos', [ProyectoController::class, 'getContratistasWithConceptos']);
        Route::get('/{proyectoId}/contratistas/{contratistaId}/conceptos', [ProyectoController::class, 'getConceptosByContratista']);
        Route::post('/{proyectoId}/contratistas/{contratistaId}/conceptos', [ProyectoController::class, 'createConcepto']);
    });

    // Rutas de contratistas
    Route::prefix('contratistas')->group(function () {
        Route::get('/', [ContratistaController::class, 'index']);
        Route::post('/', [ContratistaController::class, 'store']);
        Route::get('/stats', [ContratistaController::class, 'stats']);
        Route::get('/{id}', [ContratistaController::class, 'show']);
        Route::get('/{id}/dashboard', [ContratistaController::class, 'getDashboard']);
        Route::put('/{id}', [ContratistaController::class, 'update']);
        Route::delete('/{id}', [ContratistaController::class, 'destroy']);
        Route::post('/{id}/proyectos/{proyectoId}', [ContratistaController::class, 'assignToProject']);
        Route::delete('/{id}/proyectos/{proyectoId}', [ContratistaController::class, 'removeFromProject']);
        Route::delete('/{id}/documentos/{documentId}', [ContratistaController::class, 'deleteDocument']);

        // Nuevas rutas para conceptos en contratistas
        Route::get('/{id}/conceptos', [ContratistaController::class, 'getConceptos']);
        Route::get('/{contratistaId}/proyectos/{proyectoId}/conceptos', [ContratistaController::class, 'getConceptosByProyecto']);
        Route::post('/{contratistaId}/proyectos/{proyectoId}/conceptos', [ContratistaController::class, 'createConcepto']);
    });

    // Rutas de conceptos
    Route::prefix('conceptos')->group(function () {
        Route::get('/', [ConceptoController::class, 'index']);
        Route::post('/', [ConceptoController::class, 'store']);
        Route::get('/{id}', [ConceptoController::class, 'show']);
        Route::put('/{id}', [ConceptoController::class, 'update']);
        Route::delete('/{id}', [ConceptoController::class, 'destroy']);

        // Rutas para pagos de conceptos
        Route::get('/{id}/pagos', [ConceptoController::class, 'getPayments']);
        Route::post('/{id}/pagos', [ConceptoController::class, 'addPayment']);
        Route::delete('/{id}/pagos/{pagoId}', [ConceptoController::class, 'deletePayment']);
    });

    // Rutas de trabajadores
    Route::prefix('trabajadores')->group(function () {
        Route::get('/', [TrabajadorController::class, 'index']);
        Route::post('/', [TrabajadorController::class, 'store']);
        Route::get('/stats', [TrabajadorController::class, 'stats']);
        Route::get('/{id}', [TrabajadorController::class, 'show']);
        Route::put('/{id}', [TrabajadorController::class, 'update']);
        Route::delete('/{id}', [TrabajadorController::class, 'destroy']);

        // Rutas para asignación a proyectos
        Route::post('/{id}/proyectos', [TrabajadorController::class, 'asignarProyecto']);
        Route::delete('/{id}/proyectos', [TrabajadorController::class, 'desasignarProyecto']);
        Route::get('/{id}/proyectos', [TrabajadorController::class, 'proyectos']);

        // Rutas para pagos de trabajadores
        Route::post('/{id}/pagos', [TrabajadorController::class, 'registrarPago']);
        Route::get('/{id}/pagos', [TrabajadorController::class, 'pagos']);
        Route::delete('/{id}/pagos/{pagoId}', [TrabajadorController::class, 'eliminarPago']);
    });
});
