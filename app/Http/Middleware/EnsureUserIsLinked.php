<?php

namespace App\Http\Middleware;

use App\Models\Employee;
use closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsLinked
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

        // Check if user has linked employee
        $hasEmployee = Employee::where('user_id', $user->id)->exists();

        $roleNames = $user->roles->pluck('name')->map(fn($role) => strtolower(trim($role)))->toArray();
        $hasOnlyEmployeeRole = count($roleNames) === 1 && in_array('employee', $roleNames, true);

        // Only require a linked employee record for users who are purely employees.
        if (! $hasEmployee && $hasOnlyEmployeeRole) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->with('error', 'Your account is not linked to any employee record. Please contact your administrator.');
        }

        return $next($request);
    }
}
