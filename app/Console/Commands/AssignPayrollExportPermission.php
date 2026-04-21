<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AssignPayrollExportPermission extends Command
{
    protected $signature = 'permissions:assign-payroll-export {--role= : Role name to assign permission to}';
    protected $description = 'Assign payroll.export permission to a role';

    public function handle()
    {
        $roleName = $this->option('role');

        // If no role specified, show all roles and let user choose
        if (!$roleName) {
            $roles = Role::with('permissions')->get();

            $this->info('Current Roles:');
            $this->newLine();

            foreach ($roles as $role) {
                $hasPermission = $role->hasPermissionTo('payroll.export');
                $status = $hasPermission ? '✓' : '✗';
                $this->line("{$status} {$role->name}");
            }

            $this->newLine();
            $roleName = $this->ask('Enter role name to assign payroll.export permission');
        }

        if (!$roleName) {
            $this->error('No role specified!');
            return Command::FAILURE;
        }

        $role = Role::where('name', $roleName)->first();

        if (!$role) {
            $this->error("Role '{$roleName}' not found!");
            return Command::FAILURE;
        }

        $permission = Permission::where('name', 'payroll.export')->first();

        if (!$permission) {
            $this->error("Permission 'payroll.export' not found! Run: php artisan db:seed --class=RoleSeeder");
            return Command::FAILURE;
        }

        if ($role->hasPermissionTo('payroll.export')) {
            $this->info("Role '{$roleName}' already has 'payroll.export' permission!");
            return Command::SUCCESS;
        }

        $role->givePermissionTo('payroll.export');

        $this->info("✓ Successfully assigned 'payroll.export' permission to role '{$roleName}'");

        // Show users with this role
        $users = $role->users;
        if ($users->count() > 0) {
            $this->newLine();
            $this->info("Users with this role:");
            foreach ($users as $user) {
                $this->line("  - {$user->username}");
            }
        }

        return Command::SUCCESS;
    }
}
