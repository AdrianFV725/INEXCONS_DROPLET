<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear un usuario administrador por defecto
        User::create([
            'name' => 'Administrador',
            'email' => 'eugeniosflores@gmail.com',
            'password' => Hash::make('Roberto0203'),
        ]);

        // Puedes agregar más usuarios si es necesario
        User::create([
            'name' => 'Usuario',
            'email' => 'usuario@inexcons.com',
            'password' => Hash::make('password123'),
        ]);
    }
}
