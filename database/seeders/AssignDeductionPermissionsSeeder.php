<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AssignDeductionPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $deductionTypePerms = [
            'deduction_types.view',
            'deduction_types.create',
            'deduction_types.edit',
            'deduction_types.delete',
            'deduction_types.manage',
        ];

        $deductionCategoryPerms = [
            'deduction_categories.view',
            'deduction_categories.create',
            'deduction_categories.edit',
            'deduction_categories.delete',
            'deduction_categories.manage',
        ];

        // Ensure permissions exist
        foreach (array_merge($deductionTypePerms, $deductionCategoryPerms) as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        // Give finance role broader rights
        $finance = Role::where('name', 'finance')->first();
        if ($finance) {
            $finance->givePermissionTo(array_merge(
                ['deduction_types.view', 'deduction_categories.view'],
                ['deduction_types.create', 'deduction_types.edit', 'deduction_categories.create', 'deduction_categories.edit']
            ));
        }

        // HR role: mostly view
        $hr = Role::where('name', 'hr')->first();
        if ($hr) {
            $hr->givePermissionTo(['deduction_types.view', 'deduction_categories.view']);
        }
    }
}
