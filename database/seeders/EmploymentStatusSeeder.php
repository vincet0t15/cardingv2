<?php

namespace Database\Seeders;

use App\Models\EmploymentStatus;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EmploymentStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            ['name' => 'Plantilla', 'created_by' => 1],
            ['name' => 'COS/JO', 'created_by' => 1],
        ];

        EmploymentStatus::insert($data);
    }
}
