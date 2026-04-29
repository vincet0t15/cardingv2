<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request)
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Get the authenticated user
        $user = $request->user();

        // Check if user has any roles
        $hasRoles = DB::table('model_has_roles')
            ->where('model_id', $user->id)
            ->exists();

        // Check if user has linked employee
        $hasEmployee = Employee::where('user_id', $user->id)->exists();

        // If no roles at all, reject login
        if (! $hasRoles) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login', ['error' => 'no_role']);
        }

        $roleNames = DB::table('roles')
            ->join('model_has_roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('model_has_roles.model_id', $user->id)
            ->pluck('roles.name')
            ->map(fn($role) => strtolower(trim($role)))
            ->toArray();

        $hasOnlyEmployeeRole = count($roleNames) === 1 && in_array('employee', $roleNames, true);

        // If user is purely employee and has no linked employee, reject login
        if (! $hasEmployee && $hasOnlyEmployeeRole) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login', ['error' => 'not_linked']);
        }

        // Redirect based on user type
        if ($hasEmployee && $hasOnlyEmployeeRole) {
            return redirect()->intended(route('employee.dashboard', absolute: false));
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
