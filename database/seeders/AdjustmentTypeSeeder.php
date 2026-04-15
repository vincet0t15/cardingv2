<?php

namespace Database\Seeders;

use App\Models\AdjustmentType;
use App\Models\ReferenceType;
use Illuminate\Database\Seeder;

class AdjustmentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $adjustmentTypes = [
            [
                'name' => 'Salary Refund',
                'description' => 'Refund for overpaid salary',
                'effect' => 'positive',
            ],
            [
                'name' => 'Underpayment',
                'description' => 'Additional payment for underpaid salary',
                'effect' => 'positive',
            ],
            [
                'name' => 'Overtime Adjustment',
                'description' => 'Adjustment for overtime pay',
                'effect' => 'positive',
            ],
            [
                'name' => 'Late Deduction',
                'description' => 'Deduction for late arrival',
                'effect' => 'negative',
            ],
            [
                'name' => 'Deduction Refund',
                'description' => 'Refund for incorrect deductions',
                'effect' => 'positive',
            ],
            [
                'name' => 'Correction',
                'description' => 'General correction adjustment',
                'effect' => 'positive',
            ],
            [
                'name' => 'Absence Deduction',
                'description' => 'Deduction for unauthorized absence',
                'effect' => 'negative',
            ],
            [
                'name' => 'Holiday Pay Adjustment',
                'description' => 'Adjustment for holiday pay',
                'effect' => 'positive',
            ],
            [
                'name' => 'Monetization',
                'description' => 'Monetization of unused leave or benefits',
                'effect' => 'positive',
            ],
            [
                'name' => 'Terminal Pay',
                'description' => 'Final settlement on separation or retirement',
                'effect' => 'positive',
            ],
        ];

        foreach ($adjustmentTypes as $type) {
            $record = array_merge($type, [
                'taxable' => in_array($type['name'], ['Monetization', 'Terminal Pay']),
                'include_in_payroll' => in_array($type['name'], ['Monetization', 'Terminal Pay']),
                'requires_approval' => true,
                'restricted_roles' => in_array($type['name'], ['Terminal Pay']) ? 'hr,finance' : null,
                'created_by' => 1,
            ]);

            AdjustmentType::firstOrCreate(['name' => $type['name']], $record);
        }

        $referenceTypes = [
            [
                'name' => 'Payroll',
                'description' => 'Payroll reference number',
            ],
            [
                'name' => 'Biometric',
                'description' => 'Biometric system reference',
            ],
            [
                'name' => 'Manual Entry',
                'description' => 'Manual adjustment entry',
            ],
            [
                'name' => 'Audit Finding',
                'description' => 'Adjustment from audit finding',
            ],
            [
                'name' => 'Employee Request',
                'description' => 'Adjustment based on employee request',
            ],
        ];

        foreach ($referenceTypes as $type) {
            ReferenceType::firstOrCreate(
                ['name' => $type['name']],
                array_merge($type, ['created_by' => 1])
            );
        }
    }
}
