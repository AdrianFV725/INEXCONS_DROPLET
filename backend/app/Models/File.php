<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class File extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'original_name',
        'mime_type',
        'size',
        'path',
        'description',
        'folder_id'
    ];

    protected $appends = ['type', 'formatted_size'];

    /**
     * Obtener la carpeta a la que pertenece el archivo
     */
    public function folder()
    {
        return $this->belongsTo(Folder::class);
    }

    /**
     * Obtener el tipo de archivo simplificado
     */
    public function getTypeAttribute()
    {
        $mime = strtolower($this->mime_type);

        if (str_contains($mime, 'image')) return 'image';
        if (str_contains($mime, 'pdf')) return 'pdf';
        if (str_contains($mime, 'excel') || str_contains($mime, 'spreadsheet')) return 'excel';
        if (str_contains($mime, 'word') || str_contains($mime, 'document')) return 'word';
        if (str_contains($mime, 'zip') || str_contains($mime, 'rar')) return 'compressed';

        return 'other';
    }

    /**
     * Obtener el tamaño formateado
     */
    public function getFormattedSizeAttribute()
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $size = $this->size;
        $unit = 0;

        while ($size >= 1024 && $unit < count($units) - 1) {
            $size /= 1024;
            $unit++;
        }

        return round($size, 2) . ' ' . $units[$unit];
    }
}
