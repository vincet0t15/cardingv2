<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index()
    {
        $permissions = Permission::all()->map(function ($permission) {
            return [
                'id' => $permission->id,
                'name' => $permission->name,
                'guard_name' => $permission->guard_name,
            ];
        });

        return Inertia::render('Permissions/index', [
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:permissions,name',
        ]);

        Permission::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        return redirect()->back()->with('success', 'Permission created successfully');
    }

    public function update(Request $request, Permission $permission)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:permissions,name,' . $permission->id,
        ]);

        $permission->update([
            'name' => $validated['name'],
        ]);

        return redirect()->back()->with('success', 'Permission updated successfully');
    }

    public function destroy(Permission $permission)
    {
        $permission->delete();

        return redirect()->back()->with('success', 'Permission deleted successfully');
    }
}
