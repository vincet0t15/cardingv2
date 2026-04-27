<?php

namespace App\Http\Middleware;

use App\Models\Employee;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();
        $isEmployee = false;
        $isAdmin = false;

        if ($user) {
            // Check if user has linked employee
            $isEmployee = Employee::where('user_id', $user->id)->exists();

            // Check if user has admin role
            $isAdmin = DB::table('model_has_roles')
                ->where('model_id', $user->id)
                ->whereIn('role_id', function ($q) {
                    $q->select('id')->from('roles')->whereIn('name', ['super admin', 'admin']);
                })->exists();
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'is_active' => $user->is_active,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getPermissionNames(),
                    'is_employee' => $isEmployee,
                    'is_admin' => $isAdmin,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
