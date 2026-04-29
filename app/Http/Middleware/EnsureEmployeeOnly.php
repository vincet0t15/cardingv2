<?php

namespace App\Http\Middleware;

use closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmployeeOnly
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        $roleNames = $user->roles->pluck('name')->map(fn($role) => strtolower(trim($role)))->toArray();
        $hasOnlyEmployeeRole = count($roleNames) === 1 && in_array('employee', $roleNames, true);

        if ($hasOnlyEmployeeRole) {
            return redirect()->route('employee.dashboard');
        }

        return $next($request);
    }
}
