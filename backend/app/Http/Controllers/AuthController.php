<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Iniciar sesión de usuario
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function login(Request $request)
    {
        try {
            $credentials = $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            // Registrar intento de inicio de sesión
            Log::info('Intento de inicio de sesión', ['email' => $credentials['email']]);

            if (Auth::attempt($credentials)) {
                $user = Auth::user();
                $token = $user->createToken('auth_token')->plainTextToken;

                Log::info('Inicio de sesión exitoso', ['user_id' => $user->id]);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Inicio de sesión exitoso',
                    'user' => $user,
                    'token' => $token,
                ]);
            }

            Log::warning('Credenciales incorrectas', ['email' => $credentials['email']]);

            return response()->json([
                'status' => 'error',
                'message' => 'Credenciales incorrectas',
            ], 401);
        } catch (ValidationException $e) {
            Log::error('Error de validación en login', [
                'errors' => $e->errors(),
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Datos de inicio de sesión inválidos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error en login: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al procesar la solicitud: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cerrar sesión de usuario
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Sesión cerrada correctamente',
            ]);
        } catch (\Exception $e) {
            Log::error('Error en logout: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al cerrar sesión',
            ], 500);
        }
    }

    /**
     * Recuperar contraseña
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function recuperarPassword(Request $request)
    {
        try {
            // Validar que el correo exista en la base de datos
            $request->validate([
                'email' => 'required|email|exists:users,email',
            ]);

            $user = User::where('email', $request->email)->first();

            // Verificar que el correo coincida con el del usuario autenticado
            if (Auth::check() && Auth::user()->email !== $request->email) {
                Log::warning('Intento de recuperación de contraseña para un correo diferente al del usuario autenticado', [
                    'email_autenticado' => Auth::user()->email,
                    'email_solicitado' => $request->email
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Solo puedes solicitar la recuperación de contraseña para tu propio correo electrónico',
                ], 403);
            }

            // Generar una contraseña temporal
            $newPassword = Str::random(10);

            // Actualizar la contraseña del usuario
            $user->password = Hash::make($newPassword);
            $user->save();

            // Registrar la acción
            Log::info('Contraseña restablecida para el usuario: ' . $user->email);

            try {
                // Enviar correo con la nueva contraseña
                Mail::raw("Tu nueva contraseña temporal es: $newPassword. Por favor, cámbiala después de iniciar sesión.", function ($message) use ($user) {
                    $message->to($user->email)
                        ->subject('Recuperación de contraseña - INEXCONS');
                });

                Log::info('Correo de recuperación enviado a: ' . $user->email);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Se ha enviado una nueva contraseña a tu correo electrónico',
                ]);
            } catch (\Exception $e) {
                Log::error('Error al enviar correo de recuperación: ' . $e->getMessage());

                // Aunque el correo falló, la contraseña ya fue actualizada
                return response()->json([
                    'status' => 'warning',
                    'message' => 'Se ha restablecido la contraseña pero no se pudo enviar el correo. Por favor, contacta al administrador.',
                    'error' => $e->getMessage(),
                ], 500);
            }
        } catch (ValidationException $e) {
            Log::warning('Validación fallida en recuperación de contraseña: ' . json_encode($e->errors()));
            return response()->json([
                'status' => 'error',
                'message' => 'El correo electrónico proporcionado no está registrado en el sistema.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error inesperado en recuperación de contraseña: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Ocurrió un error inesperado. Por favor, intenta nuevamente más tarde.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener el usuario autenticado
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function user(Request $request)
    {
        try {
            return response()->json($request->user());
        } catch (\Exception $e) {
            Log::error('Error al obtener usuario: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener información del usuario',
            ], 500);
        }
    }
}
