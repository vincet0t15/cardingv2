<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::with('permissions')
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions' => $role->permissions->pluck('name'),
                    'permissions_count' => $role->permissions->count(),
                ];
            });

        $permissions = Permission::all()->pluck('name');

        return Inertia::render('Roles/index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return redirect()->back()->with('success', 'Role created successfully');
    }

    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name,' . $role->id,
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role->update([
            'name' => $validated['name'],
        ]);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return redirect()->back()->with('success', 'Role updated successfully');
    }

    public function destroy(Role $role)
    {
        if ($role->name === 'super admin') {
            return redirect()->back()->with('error', 'Cannot delete admin role');
        }

        $role->delete();

        return redirect()->back()->with('success', 'Role deleted successfully');
    }
}
