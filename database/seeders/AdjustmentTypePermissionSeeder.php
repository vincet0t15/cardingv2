<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AdjustmentTypePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions for Adjustment Types
        $adjustmentTypePermissions = [
            'adjustment_types.view',
            'adjustment_types.store',
            'adjustment_types.edit',
            'adjustment_types.delete',
        ];

        foreach ($adjustmentTypePermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create permissions for Reference Types
        $referenceTypePermissions = [
            'reference_types.view',
            'reference_types.store',
            'reference_types.edit',
            'reference_types.delete',
        ];

        foreach ($referenceTypePermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Assign all permissions to Super Admin role
        $superAdmin = Role::where('name', 'super_admin')->first();
        if ($superAdmin) {
            $superAdmin->givePermissionTo(array_merge($adjustmentTypePermissions, $referenceTypePermissions));
        }
    }
}
