<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class FileManagerController extends Controller
{
    /**
     * Obtener el contenido de una carpeta
     */
    public function getFolderContents($folderId = null)
    {
        try {
            $query = Folder::query();

            if ($folderId) {
                $query->where('parent_id', $folderId);
                $currentFolder = Folder::with('parent')->findOrFail($folderId);
            } else {
                $query->whereNull('parent_id');
                $currentFolder = null;
            }

            $folders = $query->orderBy('name')->get();

            $files = File::when($folderId, function ($query) use ($folderId) {
                return $query->where('folder_id', $folderId);
            })
                ->whereNull('deleted_at')
                ->orderBy('name')
                ->get();

            // Construir la ruta de navegación
            $breadcrumbs = [];
            if ($currentFolder) {
                $folder = $currentFolder;
                while ($folder) {
                    array_unshift($breadcrumbs, [
                        'id' => $folder->id,
                        'name' => $folder->name
                    ]);
                    $folder = $folder->parent;
                }
            }
            array_unshift($breadcrumbs, ['id' => null, 'name' => 'Inicio']);

            return response()->json([
                'folders' => $folders,
                'files' => $files,
                'currentFolder' => $currentFolder,
                'breadcrumbs' => $breadcrumbs
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener el contenido de la carpeta'], 500);
        }
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
            // Validar que hay un archivo
            if (!$request->hasFile('file')) {
                return response()->json(['error' => 'No se ha proporcionado ningún archivo'], 400);
            }

            $uploadedFile = $request->file('file');

            // Validar que el archivo es válido
            if (!$uploadedFile->isValid()) {
                return response()->json([
                    'error' => 'El archivo no es válido',
                    'detalles' => $uploadedFile->getErrorMessage()
                ], 400);
            }

            // Log información del archivo
            Log::info('Intento de subida de archivo', [
                'nombre_original' => $uploadedFile->getClientOriginalName(),
                'extension' => $uploadedFile->getClientOriginalExtension(),
                'mime_type' => $uploadedFile->getMimeType(),
                'tamaño' => $uploadedFile->getSize(),
            ]);

            // Validación del archivo
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|max:102400', // máximo 100MB
                'folder_id' => 'nullable|exists:folders,id',
                'description' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                $errors = $validator->errors();
                $errorMessage = 'Error de validación: ';

                if ($errors->has('file')) {
                    if (str_contains($errors->first('file'), 'max')) {
                        $errorMessage = 'El archivo excede el tamaño máximo permitido (100MB)';
                    } else {
                        $errorMessage = $errors->first('file');
                    }
                }

                return response()->json([
                    'error' => $errorMessage,
                    'detalles' => $errors
                ], 422);
            }

            // Asegurarse de que el directorio existe
            $uploadPath = 'uploads/' . date('Y/m/d');
            if (!Storage::disk('public')->exists($uploadPath)) {
                Storage::disk('public')->makeDirectory($uploadPath);
            }

            $originalName = $uploadedFile->getClientOriginalName();
            $fileName = Str::random(40) . '.' . $uploadedFile->getClientOriginalExtension();
            $fullPath = $uploadPath . '/' . $fileName;

            // Intentar guardar el archivo
            try {
                if (!Storage::disk('public')->putFileAs($uploadPath, $uploadedFile, $fileName)) {
                    throw new \Exception('No se pudo guardar el archivo en el almacenamiento');
                }
            } catch (\Exception $e) {
                Log::error('Error al guardar archivo: ' . $e->getMessage(), [
                    'path' => $fullPath,
                    'error' => $e->getMessage()
                ]);
                throw new \Exception('Error al guardar el archivo en el servidor');
            }

            // Determinar el tipo de archivo
            $fileType = $this->determineFileType(
                $uploadedFile->getMimeType(),
                $uploadedFile->getClientOriginalExtension()
            );

            // Crear registro en la base de datos
            try {
                $file = File::create([
                    'name' => $originalName,
                    'original_name' => $originalName,
                    'mime_type' => $uploadedFile->getMimeType(),
                    'size' => $uploadedFile->getSize(),
                    'path' => $fullPath,
                    'type' => $fileType,
                    'description' => $request->description,
                    'folder_id' => $request->folder_id
                ]);
            } catch (\Exception $e) {
                // Si falla la creación en la base de datos, eliminar el archivo
                Storage::disk('public')->delete($fullPath);
                throw new \Exception('Error al registrar el archivo en la base de datos');
            }

            return response()->json([
                'message' => 'Archivo subido correctamente',
                'file' => $file
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error al procesar la subida de archivo: ' . $e->getMessage(), [
                'excepcion' => $e,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Error al subir el archivo: ' . $e->getMessage(),
                'detalles' => $e->getMessage()
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

            return response()->download(Storage::disk('public')->path($file->path), $file->original_name);
        } catch (\Exception $e) {
            Log::error('Error al descargar archivo: ' . $e->getMessage());
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
     * Determinar el tipo de archivo basado en el mime type y extensión
     */
    private function determineFileType($mimeType, $extension)
    {
        $extension = strtolower($extension);

        // Imágenes
        if (str_starts_with($mimeType, 'image/') || in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'])) {
            return 'image';
        }

        // PDFs
        if ($mimeType === 'application/pdf' || $extension === 'pdf') {
            return 'pdf';
        }

        // Documentos de Office
        if (in_array($extension, ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'])) {
            return 'office';
        }

        // Archivos comprimidos
        if (in_array($extension, ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'])) {
            return 'compressed';
        }

        // Archivos de texto
        if (str_starts_with($mimeType, 'text/') || in_array($extension, ['txt', 'csv', 'md', 'json', 'xml'])) {
            return 'text';
        }

        // Archivos de audio
        if (str_starts_with($mimeType, 'audio/') || in_array($extension, ['mp3', 'wav', 'ogg', 'm4a'])) {
            return 'audio';
        }

        // Archivos de video
        if (str_starts_with($mimeType, 'video/') || in_array($extension, ['mp4', 'avi', 'mov', 'wmv'])) {
            return 'video';
        }

        // Tipo por defecto
        return 'other';
    }
}
