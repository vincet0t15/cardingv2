<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class AdjustmentPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Adjustment permissions
            ['name' => 'view adjustments', 'guard_name' => 'web'],
            ['name' => 'create adjustments', 'guard_name' => 'web'],
            ['name' => 'edit adjustments', 'guard_name' => 'web'],
            ['name' => 'approve adjustments', 'guard_name' => 'web'],
            ['name' => 'process adjustments', 'guard_name' => 'web'],
            ['name' => 'delete adjustments', 'guard_name' => 'web'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name'], 'guard_name' => $permission['guard_name']],
                $permission
            );
        }

        $this->command->info('Adjustment permissions seeded successfully!');
    }
}
