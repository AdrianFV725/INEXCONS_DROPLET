<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class DocumentAccessMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Registra información de la solicitud para depuración
        Log::info('Accessing document: ' . $request->path());

        // Obtener la respuesta del siguiente middleware
        $response = $next($request);

        if ($this->isDocumentRequest($request)) {
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET');
            $response->headers->set('Content-Disposition', 'inline');
            $response->headers->set('X-Content-Type-Options', 'nosniff');
        }

        return $response;
    }

    /**
     * Determina si la solicitud es para un documento.
     */
    private function isDocumentRequest(Request $request): bool
    {
        $path = $request->path();
        $extensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif'];

        foreach ($extensions as $extension) {
            if (str_ends_with(strtolower($path), $extension)) {
                return true;
            }
        }

        return false;
    }
}
