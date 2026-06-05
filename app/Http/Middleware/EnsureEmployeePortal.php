<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmployeePortal
{
    /**
     * Handle an incoming request.
     *
     * Only allow users who should be using the Employee Portal to access
     * employee-specific routes. Admin users trying to access employee pages
     * are redirected to the admin dashboard.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // If user is an admin type trying to access employee portal, redirect to admin dashboard
        if (! $user->shouldUseEmployeePortal()) {
            return redirect()->route('dashboard')->with('error', 'Admins cannot access the employee portal.');
        }

        return $next($request);
    }
}
