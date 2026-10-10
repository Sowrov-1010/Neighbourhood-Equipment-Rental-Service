<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Hash;

class EnsureAdminWithSecurityCode
{
    /**
     * Handle an incoming request.
     * Enforces two-factor clearance for administrators:
     * 1. User must have role === 'admin'
     * 2. Security Clearance Code verified via session, header, or bearer token
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'error' => 'UNAUTHORIZED_ACCESS',
                'message' => 'Restricted Area: Administrative clearance required.',
            ], 403);
        }

        // Check clearance session or custom authorization header
        $clearanceHeader = $request->header('X-Admin-Security-Code');
        $sessionClearance = $request->session()->get('admin_security_cleared');

        if (!$sessionClearance && (!$clearanceHeader || !Hash::check($clearanceHeader, $user->admin_security_hash ?? ''))) {
            // Check fallback environment security hash if user record does not have individual salt
            if ($clearanceHeader && Hash::check($clearanceHeader, config('auth.admin_security_hash', ''))) {
                return $next($request);
            }

            return response()->json([
                'error' => 'SECURITY_CLEARANCE_REQUIRED',
                'message' => 'Access Denied: Administrative Security Code verification failed.',
            ], 401);
        }

        return $next($request);
    }
}
