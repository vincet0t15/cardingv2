<?php

namespace Database\Seeders;

use App\Models\EmployeeStatus;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EmployeeStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            ['name' => 'Active', 'created_by' => 1],
            ['name' => 'Inactive', 'created_by' => 1],
            ['name' => 'Resigned', 'created_by' => 1],
            ['name' => 'Terminated', 'created_by' => 1],
        ];


        foreach ($data as $item) {
    EmployeeStatus::updateOrCreate(
        ['name' => $item['name']], // Search criteria
        ['created_by' => $item['created_by']] // Data to update/insert
    );
}
    }
}
