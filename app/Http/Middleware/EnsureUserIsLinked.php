<?php

namespace App\Http\Middleware;

use closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsLinked
{
    /**
     * Handle an incoming request.
     *
     * Users with the "employee" role who are NOT linked to an employee record
     * are logged out, UNLESS they also have an admin-level role.
     * Admin users are allowed through regardless of employee linkage.
     */
    public function handle(Request $request, closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // Admin users are always allowed through
        if ($user->isAdmin()) {
            return $next($request);
        }

        // Non-admin users with "employee" role MUST have a linked employee record
        if ($user->hasRole('employee') && ! $user->isEmployee()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->with('error', 'Your account is not linked to any employee record. Please contact your administrator.');
        }

        return $next($request);
    }
}
