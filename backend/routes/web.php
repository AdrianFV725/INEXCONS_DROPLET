<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Ruta para servir documentos desde storage
Route::get('/storage/documentos/ine/{filename}', function ($filename) {
    $path = 'documentos/ine/' . $filename;

    if (!Storage::disk('public')->exists($path)) {
        abort(404);
    }

    $file = Storage::disk('public')->get($path);

    // Determinar el tipo MIME basado en la extensión del archivo
    $extension = pathinfo($filename, PATHINFO_EXTENSION);
    $mimeTypes = [
        'pdf' => 'application/pdf',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
    ];
    $type = $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';

    return response($file, 200)
        ->withHeaders([
            'Content-Type' => $type,
            'Content-Disposition' => 'inline; filename="' . $filename . '"'
        ]);
});

// Agregar una ruta de login para evitar el error de redirección
Route::get('/login', function () {
    return response()->json(['message' => 'Por favor, inicia sesión a través de la API'], 401);
})->name('login');
