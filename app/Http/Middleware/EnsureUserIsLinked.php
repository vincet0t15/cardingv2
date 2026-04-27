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

        // Check if user has admin role
        $isAdmin = DB::table('model_has_roles')
            ->where('model_id', $user->id)
            ->whereIn('role_id', function ($q) {
                $q->select('id')->from('roles')->whereIn('name', ['super admin', 'admin']);
            })->exists();

        // If user has neither employee link nor admin role, logout
        if (! $hasEmployee && ! $isAdmin) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->with('error', 'Your account is not linked to any employee record. Please contact your administrator.');
        }

        return $next($request);
    }
}
