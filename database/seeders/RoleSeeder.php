<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions
        $permissions = [
            // Employee permissions
            'employees.view',
            'employees.create',
            'employees.edit',
            'employees.delete',
            'employees.manage',

            // Salary permissions
            'salaries.view',
            'salaries.create',
            'salaries.edit',
            'salaries.delete',

            // PERA permissions
            'peras.view',
            'peras.create',
            'peras.edit',
            'peras.delete',

            // RATA permissions
            'ratas.view',
            'ratas.create',
            'ratas.edit',
            'ratas.delete',

            // Hazard Pay permissions
            'hazard_pays.view',
            'hazard_pays.create',
            'hazard_pays.edit',
            'hazard_pays.delete',

            // Clothing Allowance permissions
            'clothing_allowances.view',
            'clothing_allowances.create',
            'clothing_allowances.edit',
            'clothing_allowances.delete',

            // Payroll permissions
            'payroll.view',
            'payroll.export',
            'payroll.manage',

            // Supplier permissions
            'suppliers.view',
            'suppliers.manage',

            // Claims permissions
            'claims.view',
            'claims.create',
            'claims.edit',
            'claims.delete',
            'claims.manage',

            // Deductions permissions
            'deductions.view',
            'deductions.create',
            'deductions.edit',
            'deductions.delete',
            'deductions.manage',

            // Employee Deductions permissions
            'employee-deductions.view',
            'employee-deductions.create',
            'employee-deductions.edit',
            'employee-deductions.delete',
            'employee-deductions.manage',

            // Settings permissions (general)
            'settings.view',
            'settings.manage',

            // Offices permissions
            'offices.view',
            'offices.create',
            'offices.edit',
            'offices.delete',
            'offices.manage',

            // Employment Status permissions
            'employment_statuses.view',
            'employment_statuses.create',
            'employment_statuses.edit',
            'employment_statuses.delete',
            'employment_statuses.manage',

            // Deduction Types permissions
            'deduction_types.view',
            'deduction_types.create',
            'deduction_types.edit',
            'deduction_types.delete',
            'deduction_types.manage',

            // Document Types permissions
            'document_types.view',
            'document_types.create',
            'document_types.edit',
            'document_types.delete',
            'document_types.manage',

            // Claim Types permissions
            'claim_types.view',
            'claim_types.create',
            'claim_types.edit',
            'claim_types.delete',
            'claim_types.manage',

            // Accounts permissions
            'accounts.view',
            'accounts.manage',

            // Roles & Permissions
            'roles.view',
            'roles.manage',
            'permissions.view',
            'permissions.manage',

            // General Funds permissions
            'general_funds.view',
            'general_funds.store',
            'general_funds.edit',
            'general_funds.delete',
            'general_funds.manage',

            // Source of Fund Codes permissions
            'source_of_fund_codes.view',
            'source_of_fund_codes.store',
            'source_of_fund_codes.edit',
            'source_of_fund_codes.delete',
            'source_of_fund_codes.manage',

            // Employee Source of Fund Report
            'employees.source_of_fund.view',

            // Database Backup & Restore
            'database.backup',
            'database.restore',

            // Audit Logs
            'audit_logs.view',
            'audit_logs.export',

            // Adjustment permissions
            'adjustments.view',
            'adjustments.create',
            'adjustments.edit',
            'adjustments.delete',
            'adjustments.approve',
            'adjustments.reject',
            'adjustments.process',
            'adjustments.manage',

            // Adjustment Type permissions
            'adjustment_types.view',
            'adjustment_types.store',
            'adjustment_types.edit',
            'adjustment_types.delete',
            'adjustment_types.manage',

            // Reference Type permissions
            'reference_types.view',
            'reference_types.store',
            'reference_types.edit',
            'reference_types.delete',
            'reference_types.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web']
            );
        }

        // Create roles
        $superAdminRole = Role::firstOrCreate(['name' => 'super admin', 'guard_name' => 'web']);
        $superAdminRole->syncPermissions(Permission::all());

        // HR role with specific permissions
        $hrRole = Role::firstOrCreate(['name' => 'hr', 'guard_name' => 'web']);
        $hrPermissions = [
            'employees.view',
            'employees.edit',
            'employees.manage',
            'claims.view',
            'claims.create',
            'claims.edit',
            'claims.delete',
            'claims.manage',
            'adjustments.view',
            'adjustments.create',
            'adjustments.edit',
            'adjustments.approve',
            'adjustments.reject',
            'adjustments.process',
            'adjustments.manage',
            'deductions.view',
            'deductions.create',
            'deductions.edit',
            'deductions.manage',
            'payroll.view',
            'payroll.manage',
        ];
        $hrRole->syncPermissions($hrPermissions);

        // Finance role with specific permissions
        $financeRole = Role::firstOrCreate(['name' => 'finance', 'guard_name' => 'web']);
        $financePermissions = [
            'employees.view',
            'employees.manage',
            'adjustments.view',
            'adjustments.create',
            'adjustments.edit',
            'adjustments.approve',
            'adjustments.reject',
            'adjustments.process',
            'adjustments.manage',
            'claims.view',
            'claims.create',
            'claims.edit',
            'claims.delete',
            'claims.manage',
            'deductions.view',
            'deductions.manage',
            'payroll.view',
            'payroll.export',
            'payroll.manage',
            'suppliers.view',
            'suppliers.manage',
        ];
        $financeRole->syncPermissions($financePermissions);

        // Employee role with basic permissions
        $employeeRole = Role::firstOrCreate(['name' => 'employee', 'guard_name' => 'web']);
        $employeePermissions = [
            'adjustments.view',
            'adjustments.create',
            'claims.view',
            'claims.create',
        ];
        $employeeRole->syncPermissions($employeePermissions);
    }
}
