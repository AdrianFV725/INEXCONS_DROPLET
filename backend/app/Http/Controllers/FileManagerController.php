<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class FileManagerController extends Controller
{
    /**
     * Obtener el contenido de una carpeta
     */
    public function getFolderContents($folderId = null)
    {
        try {
            Log::info('Obteniendo contenido de carpeta. ID: ' . ($folderId ?? 'root'));

            $query = Folder::query();

            if ($folderId) {
                // Si se proporciona un ID, buscar la carpeta actual y sus contenidos
                $currentFolder = Folder::with('parent')->findOrFail($folderId);
                Log::info('Carpeta actual:', ['id' => $currentFolder->id, 'name' => $currentFolder->name]);

                $query->where('parent_id', $folderId);
            } else {
                // Si no hay ID, mostrar carpetas raíz
                $query->whereNull('parent_id');
                $currentFolder = null;
                Log::info('Carpeta raíz');
            }

            $folders = $query->orderBy('name')->get();
            Log::info('Carpetas encontradas: ' . $folders->count());

            $files = File::when($folderId, function ($query) use ($folderId) {
                return $query->where('folder_id', $folderId);
            })
                ->whereNull('deleted_at')
                ->orderBy('name')
                ->get();
            Log::info('Archivos encontrados: ' . $files->count());

            // Construir la ruta de navegación
            $breadcrumbs = [];
            if ($currentFolder) {
                $folder = $currentFolder;
                while ($folder) {
                    Log::info('Agregando a breadcrumb:', ['id' => $folder->id, 'name' => $folder->name]);
                    array_unshift($breadcrumbs, [
                        'id' => $folder->id,
                        'name' => $folder->name,
                        'parent_id' => $folder->parent_id
                    ]);
                    $folder = $folder->parent;
                }
            }

            // Siempre agregar el inicio
            array_unshift($breadcrumbs, [
                'id' => null,
                'name' => 'Inicio',
                'parent_id' => null
            ]);

            Log::info('Breadcrumbs construidos:', $breadcrumbs);

            // Formatear los archivos para incluir información adicional
            $formattedFiles = $files->map(function ($file) {
                return [
                    'id' => $file->id,
                    'name' => $file->name,
                    'original_name' => $file->original_name,
                    'mime_type' => $file->mime_type,
                    'size' => $file->size,
                    'formatted_size' => $this->formatFileSize($file->size),
                    'type' => $file->type,
                    'folder_id' => $file->folder_id,
                    'created_at' => $file->created_at,
                    'updated_at' => $file->updated_at
                ];
            });

            return response()->json([
                'success' => true,
                'currentFolder' => $currentFolder,
                'folders' => $folders,
                'files' => $formattedFiles,
                'breadcrumbs' => $breadcrumbs
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener contenido de carpeta: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al obtener el contenido de la carpeta',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Formatear el tamaño del archivo
     */
    private function formatFileSize($size)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = $size > 0 ? floor(log($size, 1024)) : 0;
        return number_format($size / pow(1024, $power), 2, '.', ',') . ' ' . $units[$power];
    }

    /**
     * Crear una nueva carpeta
     */
    public function createFolder(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'parent_id' => 'nullable|exists:folders,id'
            ]);

            $folder = Folder::create($validated);

            return response()->json($folder, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear la carpeta'], 500);
        }
    }

    /**
     * Subir un archivo
     */
    public function uploadFile(Request $request)
    {
        try {
            // 1. Validación básica
            if (!$request->hasFile('file')) {
                return response()->json(['error' => 'No se ha proporcionado ningún archivo'], 400);
            }

            $file = $request->file('file');

            // 2. Validar el archivo
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|max:102400', // 100MB máximo
                'folder_id' => 'nullable|exists:folders,id'
            ]);

            if ($validator->fails()) {
                $errors = $validator->errors();
                $errorMessage = 'Error de validación';

                if ($errors->has('file')) {
                    if (str_contains($errors->first('file'), 'max')) {
                        $errorMessage = 'El archivo excede el tamaño máximo permitido (100MB)';
                    }
                }

                return response()->json([
                    'error' => $errorMessage,
                    'detalles' => $errors
                ], 422);
            }

            // 3. Preparar el nombre del archivo
            $fileName = $file->getClientOriginalName();
            $fileNameToStore = time() . '_' . $fileName;

            // 4. Guardar el archivo
            $path = $file->storeAs('uploads', $fileNameToStore, 'public');

            if (!$path) {
                return response()->json(['error' => 'Error al guardar el archivo'], 500);
            }

            // 5. Crear el registro en la base de datos
            $fileRecord = File::create([
                'name' => $fileName,
                'original_name' => $fileName,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'path' => $path,
                'type' => $this->determineFileType($file->getMimeType(), $file->getClientOriginalExtension()),
                'folder_id' => $request->folder_id
            ]);

            // 6. Retornar respuesta exitosa
            return response()->json([
                'message' => 'Archivo subido correctamente',
                'file' => $fileRecord
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error al subir archivo: ' . $e->getMessage());

            // Manejar errores específicos
            if (str_contains($e->getMessage(), '413')) {
                return response()->json([
                    'error' => 'El archivo excede el tamaño máximo permitido (100MB)',
                    'mensaje' => 'Por favor, intenta con un archivo más pequeño o contacta al administrador para aumentar el límite.'
                ], 413);
            }

            return response()->json([
                'error' => 'Error al subir el archivo',
                'mensaje' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Descargar un archivo
     */
    public function downloadFile($id)
    {
        try {
            $file = File::findOrFail($id);

            if (!Storage::disk('public')->exists($file->path)) {
                return response()->json(['error' => 'Archivo no encontrado'], 404);
            }

            return Storage::disk('public')->download($file->path, $file->original_name);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al descargar el archivo'], 500);
        }
    }

    /**
     * Eliminar una carpeta
     */
    public function deleteFolder($id)
    {
        try {
            $folder = Folder::findOrFail($id);

            // Eliminar archivos en la carpeta
            foreach ($folder->files as $file) {
                Storage::disk('public')->delete($file->path);
                $file->delete();
            }

            // Eliminar subcarpetas recursivamente
            foreach ($folder->allSubfolders as $subfolder) {
                foreach ($subfolder->files as $file) {
                    Storage::disk('public')->delete($file->path);
                    $file->delete();
                }
                $subfolder->delete();
            }

            $folder->delete();

            return response()->json(['message' => 'Carpeta eliminada correctamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar la carpeta'], 500);
        }
    }

    /**
     * Eliminar un archivo
     */
    public function deleteFile($id)
    {
        try {
            $file = File::findOrFail($id);

            Storage::disk('public')->delete($file->path);
            $file->delete();

            return response()->json(['message' => 'Archivo eliminado correctamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar el archivo'], 500);
        }
    }

    /**
     * Actualizar una carpeta
     */
    public function updateFolder(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string'
            ]);

            $folder = Folder::findOrFail($id);
            $folder->update($validated);

            return response()->json([
                'message' => 'Carpeta actualizada correctamente',
                'folder' => $folder
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar la carpeta'], 500);
        }
    }

    /**
     * Buscar archivos y carpetas
     */
    public function searchFiles(Request $request)
    {
        try {
            $query = $request->input('query');

            if (empty($query)) {
                return response()->json([
                    'folders' => [],
                    'files' => []
                ]);
            }

            // Buscar carpetas
            $folders = Folder::where('name', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->orderBy('name')
                ->get();

            // Buscar archivos
            $files = File::where('name', 'like', "%{$query}%")
                ->whereNull('deleted_at')
                ->orderBy('name')
                ->get();

            return response()->json([
                'folders' => $folders,
                'files' => $files
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al buscar archivos'], 500);
        }
    }

    /**
     * Determinar el tipo de archivo basado en su MIME type y extensión
     */
    private function determineFileType($mimeType, $extension)
    {
        // Convertir la extensión a minúsculas para comparación
        $extension = strtolower($extension);

        // Determinar el tipo basado en el MIME type y la extensión
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        } elseif ($mimeType === 'application/pdf' || $extension === 'pdf') {
            return 'pdf';
        } elseif (in_array($extension, ['doc', 'docx', 'txt', 'rtf'])) {
            return 'text';
        } elseif (in_array($extension, ['xls', 'xlsx', 'csv'])) {
            return 'excel';
        } elseif (in_array($extension, ['zip', 'rar', '7z', 'tar', 'gz'])) {
            return 'compressed';
        } elseif (str_starts_with($mimeType, 'audio/')) {
            return 'audio';
        } elseif (str_starts_with($mimeType, 'video/')) {
            return 'video';
        } elseif (in_array($extension, ['ppt', 'pptx', 'odp'])) {
            return 'presentation';
        } else {
            return 'other';
        }
    }
}
