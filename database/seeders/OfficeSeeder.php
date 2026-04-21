<?php

namespace Database\Seeders;

use App\Models\Office;
use Illuminate\Database\Seeder;

class OfficeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $offices = [
            [
                'name' => 'OFFICE OF THE MUNICIPAL MAYOR',
                'code' => 'MO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL BUDGET',
                'code' => 'MBO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE HUMAN RESOURCE MANAGEMENT',
                'code' => 'HRMO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE SANGUNIANG BAYAN',
                'code' => 'SBO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL PLANNING AND DEVELOPMENT',
                'code' => 'MPDO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL ENGINEERING',
                'code' => 'MEO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL TOURISM',
                'code' => 'OMT',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL TREASURY',
                'code' => 'MTO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL ACCOUNTING',
                'code' => 'MACCO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL COOPERATIVE AND DEVELOPMENT',
                'code' => 'MCDO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL GENERAL SERVICES',
                'code' => 'GSO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL ENVIRONMENT AND NATURAL RESOURCES',
                'code' => 'MERNRO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL ASSESSOR',
                'code' => 'MASSO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL ECONOMIC ENTERPRISE DEVELOPMENT',
                'code' => 'MEEDO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL HEALTH',
                'code' => 'RHU',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL AGRICULTURE',
                'code' => 'MAO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL SOCIAL WELFARE AND DEVELOPMENT',
                'code' => 'MSWDO',
                'created_by' => 1,
            ],
            [
                'name' => 'OFFICE OF THE MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT',
                'code' => 'MDRRMO',
                'created_by' => 1,
            ],

        ];

        foreach ($offices as $office) {
            Office::updateOrCreate(
                ['code' => $office['code']],
                $office
            );
        }
    }
}
