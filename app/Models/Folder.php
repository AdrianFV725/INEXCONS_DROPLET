<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Folder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'parent_id'
    ];

    /**
     * Obtener la carpeta padre
     */
    public function parent()
    {
        return $this->belongsTo(Folder::class, 'parent_id');
    }

    /**
     * Obtener las subcarpetas
     */
    public function subfolders()
    {
        return $this->hasMany(Folder::class, 'parent_id');
    }

    /**
     * Obtener los archivos en esta carpeta
     */
    public function files()
    {
        return $this->hasMany(File::class);
    }

    /**
     * Obtener todas las subcarpetas recursivamente
     */
    public function allSubfolders()
    {
        return $this->subfolders()->with('allSubfolders');
    }

    /**
     * Obtener la ruta completa de la carpeta
     */
    public function getFullPathAttribute()
    {
        $path = [$this->name];
        $parent = $this->parent;

        while ($parent) {
            array_unshift($path, $parent->name);
            $parent = $parent->parent;
        }

        return implode('/', $path);
    }
}
