<?php

namespace Database\Seeders;

use App\Models\ClaimType;
use Illuminate\Database\Seeder;

class ClaimTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Medical Reimbursement', 'code' => 'MEDICAL', 'description' => 'Medical expenses reimbursement'],
            ['name' => 'Travel Reimbursement', 'code' => 'TRAVEL', 'description' => 'Travel-related expenses'],
            ['name' => 'Overtime Pay', 'code' => 'OVERTIME', 'description' => 'Overtime compensation'],
            ['name' => 'Communication Allowance', 'code' => 'COMMUNICATION', 'description' => 'Phone/internet allowance'],
            ['name' => 'Representation Allowance', 'code' => 'REPRESENTATION', 'description' => 'Official representation expenses'],
            ['name' => 'Cash Advance', 'code' => 'CASH_ADVANCE', 'description' => 'Cash advance for official purposes'],
            ['name' => 'Meal Allowance', 'code' => 'MEAL', 'description' => 'Meal expenses during official travel'],
            ['name' => 'Transportation Allowance', 'code' => 'TRANSPORTATION', 'description' => 'Transportation expenses'],
            ['name' => 'Laundry', 'code' => 'LAUNDRY', 'description' => 'Laundry / dry cleaning expenses'],
            ['name' => 'Subsistence', 'code' => 'SUBSISTENCE', 'description' => 'Subsistence per-diem or related expenses'],
            ['name' => 'Other Claims', 'code' => 'OTHER', 'description' => 'Other reimbursable expenses'],
        ];

        foreach ($types as $type) {
            ClaimType::firstOrCreate(
                ['code' => $type['code']],
                array_merge($type, ['is_active' => true])
            );
        }
    }
}
