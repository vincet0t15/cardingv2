<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AssignAdjustmentPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get Super Admin role
        $superAdmin = Role::where('name', 'Super Admin')->first();

        if (!$superAdmin) {
            $this->command->error('Super Admin role not found!');
            return;
        }

        // Get all adjustment permissions
        $adjustmentPermissions = Permission::where('name', 'like', '%adjustments%')->get();

        if ($adjustmentPermissions->isEmpty()) {
            $this->command->error('No adjustment permissions found. Run AdjustmentPermissionSeeder first.');
            return;
        }

        // Assign all adjustment permissions to Super Admin
        $superAdmin->givePermissionTo($adjustmentPermissions);

        $this->command->info("✅ Assigned " . $adjustmentPermissions->count() . " adjustment permissions to Super Admin role");
        $this->command->info("\nPermissions assigned:");
        foreach ($adjustmentPermissions as $permission) {
            $this->command->line("  ✓ " . $permission->name);
        }
    }
}
