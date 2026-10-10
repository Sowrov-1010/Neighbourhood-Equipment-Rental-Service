<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsNotBlacklisted
{
    /**
     * Handle an incoming request.
     * Enforces that penalized or blacklisted accounts are blocked from:
     * - Creating new equipment listings
     * - Requesting borrow handovers
     * - Broadcasting community requests
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->is_blacklisted) {
            $reason = $user->blacklist_reason ?? 'Administrative Sanctions Active: Multiple delinquency infractions.';
            
            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'ACCOUNT_BLACK_LISTED',
                    'message' => 'Access Denied: Your account has been suspended by District Administration.',
                    'reason' => $reason,
                    'blacklisted_at' => $user->blacklisted_at,
                    'remedy' => 'Contact District Arbitration Board via admin dispute desk.',
                ], 403);
            }

            return redirect()->route('dashboard')->with('error', "Account Suspended: {$reason}");
        }

        return $next($request);
    }
}
