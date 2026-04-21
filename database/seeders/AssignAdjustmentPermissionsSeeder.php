<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AssignAdjustmentPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure permissions exist
        $permissions = [
            'adjustment_types.view',
            'adjustment_types.store',
            'adjustment_types.edit',
            'adjustment_types.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Assign adjustment creation and approval to HR and Finance roles if they exist
        $rolesToAssign = ['hr', 'finance', 'super admin'];

        foreach ($rolesToAssign as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->givePermissionTo($permissions);
            }
        }
    }
}
