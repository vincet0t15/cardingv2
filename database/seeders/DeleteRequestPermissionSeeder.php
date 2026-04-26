<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DeleteRequestPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'delete_requests.view',
            'delete_requests.approve',
            'delete_requests.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $superAdmin = Role::where('name', 'super admin')->first();
        $admin = Role::where('name', 'admin')->first();

        if ($superAdmin) {
            $superAdmin->givePermissionTo($permissions);
        }

        if ($admin) {
            $admin->givePermissionTo($permissions);
        }

        $this->command->info('Delete request permissions seeded successfully.');
    }

    public function __construct($command = null)
    {
        $this->command = $command;
    }
}