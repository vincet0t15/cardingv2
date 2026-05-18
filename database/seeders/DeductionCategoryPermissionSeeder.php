<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DeductionCategoryPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            'deduction_categories.view',
            'deduction_categories.create',
            'deduction_categories.edit',
            'deduction_categories.delete',
            'deduction_categories.manage',
        ];

        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        // Assign to existing roles if present
        $super = Role::where('name', 'super admin')->first();
        if ($super) {
            $super->givePermissionTo($permissions);
        }

        $hr = Role::where('name', 'hr')->first();
        if ($hr) {
            $hr->givePermissionTo(['deduction_categories.view']);
        }

        $finance = Role::where('name', 'finance')->first();
        if ($finance) {
            $finance->givePermissionTo(['deduction_categories.view', 'deduction_categories.create', 'deduction_categories.edit']);
        }
    }
}
