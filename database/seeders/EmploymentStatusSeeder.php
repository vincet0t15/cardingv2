<?php

namespace Database\Seeders;

use App\Models\EmploymentStatus;
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
            ['name' => 'Contractual', 'created_by' => 1],
        ];

        foreach ($data as $item) {
            EmploymentStatus::updateOrCreate(
                ['name' => $item['name']],
                ['created_by' => $item['created_by']]
            );
        }
    }
}
