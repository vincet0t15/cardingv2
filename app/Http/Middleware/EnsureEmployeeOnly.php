<?php

namespace App\Http\Middleware;

use closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmployeeOnly
{
    /**
     * Handle an incoming request.
     *
     * If the user should be using the Employee Portal instead of Admin Dashboard,
     * redirect them accordingly. This prevents admin-role users from accidentally
     * landing on the employee dashboard, and vice versa.
     */
    public function handle(Request $request, closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($user->shouldUseEmployeePortal()) {
            return redirect()->route('employee.dashboard');
        }

        return $next($request);
    }
}
