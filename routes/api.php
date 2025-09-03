// Rutas para el gestor de archivos
Route::prefix('file-manager')->group(function () {
Route::get('folders/{folder?}', [FileManagerController::class, 'getFolderContents']);
Route::post('folders', [FileManagerController::class, 'createFolder']);
Route::delete('folders/{folder}', [FileManagerController::class, 'deleteFolder']);

Route::post('files', [FileManagerController::class, 'uploadFile']);
Route::get('files/{file}/download', [FileManagerController::class, 'downloadFile']);
Route::delete('files/{file}', [FileManagerController::class, 'deleteFile']);
});