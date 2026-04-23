<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);
        $this->call(\Database\Seeders\DeductionCategoryPermissionSeeder::class);
        $this->call(\Database\Seeders\AssignDeductionPermissionsSeeder::class);

        $password = env('ADMIN_DEFAULT_PASSWORD', 'ChangeMe!@2026Secure');
        $adminUser = User::updateOrCreate(
            ['username' => 'administrator'],
            [
                'name' => 'Zyrus Vince B. Famini',
                'password' => Hash::make($password),
                'is_active' => true,
            ]
        );

        $adminUser->assignRole('super admin');

        $this->call([
            EmployeeStatusSeeder::class,
            // EmploymentStatusSeeder::class,
            OfficeSeeder::class,
            DeductionTypeSeeder::class,
            ClaimTypeSeeder::class,
            GeneralFundSeeder::class,
        ]);
    }
}
