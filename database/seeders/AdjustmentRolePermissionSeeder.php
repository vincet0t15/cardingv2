<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AdjustmentRolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define adjustment permissions
        $adjustmentPermissions = [
            'adjustments.view',
            'adjustments.create',
            'adjustments.edit',
            'adjustments.delete',
            'adjustments.approve',
            'adjustments.reject',
            'adjustments.process',
            'adjustments.manage',
        ];

        // Ensure all permissions exist
        foreach ($adjustmentPermissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web'],
                ['name' => $permission, 'guard_name' => 'web']
            );
        }

        // Employee role - can view and create adjustments only
        $employeeRole = Role::where('name', 'employee')->first();
        if ($employeeRole) {
            $employeeRole->syncPermissions([
                'adjustments.view',
                'adjustments.create',
            ]);
        }

        // HR role - can manage adjustments (view, create, edit, approve, reject, process)
        $hrRole = Role::where('name', 'hr')->first();
        if ($hrRole) {
            $hrRole->syncPermissions([
                'adjustments.view',
                'adjustments.create',
                'adjustments.edit',
                'adjustments.approve',
                'adjustments.reject',
                'adjustments.process',
                'adjustments.manage',
            ]);
        }

        // Finance role - can manage adjustments (view, create, edit, approve, reject, process)
        $financeRole = Role::where('name', 'finance')->first();
        if ($financeRole) {
            $financeRole->syncPermissions([
                'adjustments.view',
                'adjustments.create',
                'adjustments.edit',
                'adjustments.approve',
                'adjustments.reject',
                'adjustments.process',
                'adjustments.manage',
            ]);
        }

        // Super admin role already has all permissions via RoleSeeder

        $this->command->info('Adjustment role permissions assigned successfully!');
    }
}
