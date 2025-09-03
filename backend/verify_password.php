<?php

$password = 'Roberto0203';
$hash = '$2y$12$CUfIlEcK3IaOeQpFgwuAqudRpQJhnR/MeLcfFDxjzPG//5l3zuVIa';

if (password_verify($password, $hash)) {
    echo "La contraseña es correcta.\n";
} else {
    echo "La contraseña es incorrecta.\n";
}

// Generar un nuevo hash para la contraseña
$newHash = password_hash($password, PASSWORD_BCRYPT);
echo "Nuevo hash generado: " . $newHash . "\n";
echo "Verificación del nuevo hash: " . (password_verify($password, $newHash) ? "Correcto" : "Incorrecto") . "\n";
