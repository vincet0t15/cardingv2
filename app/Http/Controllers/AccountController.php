<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $users = User::query()
            ->with('roles:name')
            ->select(['id', 'name', 'username', 'is_active', 'last_seen', 'created_at'])
            ->when($search, function ($query) use ($search) {
                $query->where('name', 'like', '%' . $search . '%')
                    ->orWhere('username', 'like', '%' . $search . '%');
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        // Transform users to convert roles from objects to array of strings and add online status
        $users->getCollection()->transform(function ($user) {
            $user->roles = $user->roles->pluck('name')->toArray();
            // User is considered online if last_seen is within the last 5 minutes
            $user->is_online = $user->last_seen && $user->last_seen->diffInMinutes(now()) < 5;
            $user->last_seen_formatted = $user->last_seen ? $user->last_seen->diffForHumans() : null;
            return $user;
        });

        $roles = Role::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                ];
            });

        return Inertia::render('Accounts/index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => [
                'search' => $search,
            ]
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'is_active' => 'boolean',
            'roles' => 'array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        if (isset($validated['is_active'])) {
            $user->is_active = $validated['is_active'];
        }

        $user->save();

        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        return redirect()->back()->with('success', 'Account updated successfully');
    }
}
