<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Hash;
use App\Models\User;

// Buscar el usuario por email
$user = User::where('email', 'eugeniosflores@gmail.com')->first();

if ($user) {
    // Actualizar la contraseña
    $user->password = Hash::make('Roberto0203');
    $user->save();

    echo "Contraseña actualizada correctamente para el usuario: " . $user->email . "\n";
} else {
    echo "No se encontró el usuario con el email: eugeniosflores@gmail.com\n";
}
