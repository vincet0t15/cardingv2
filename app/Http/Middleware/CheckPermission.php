<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     * Admin role bypasses all permission checks.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission, string $guard = null): Response
    {
        $user = $request->user();

        // Admin role bypasses all permission checks
        if ($user && $user->hasRole('super admin')) {
            return $next($request);
        }

        // Check if user has the required permission
        if (!$user || !$user->hasPermissionTo($permission, $guard ?? 'web')) {
            abort(403, 'User does not have the right permissions.');
        }

        return $next($request);
    }
}
