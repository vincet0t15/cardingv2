<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AiSettingsPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permission = Permission::firstOrCreate([
            'name' => 'ai_settings.manage',
            'guard_name' => 'web',
        ]);

        $role = Role::where('name', 'super admin')->first();
        if ($role && ! $role->hasPermissionTo('ai_settings.manage')) {
            $role->givePermissionTo($permission);
            $this->command->info('Added ai_settings.manage to super admin role.');
        } else {
            $this->command->info('ai_settings.manage permission already exists.');
        }
    }
}
