<?php

namespace Database\Seeders;

use App\Models\AdjustmentType;
use App\Models\ReferenceType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

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


        DB::transaction(function () use ($adjustmentTypes) {
            $hasTaxable = Schema::hasColumn('adjustment_types', 'taxable');
            $hasIncludeInPayroll = Schema::hasColumn('adjustment_types', 'include_in_payroll');
            $hasRequiresApproval = Schema::hasColumn('adjustment_types', 'requires_approval');
            $hasCreatedBy = Schema::hasColumn('adjustment_types', 'created_by');

            foreach ($adjustmentTypes as $type) {
                $record = $type;

                if ($hasTaxable) {
                    $record['taxable'] = in_array($type['name'], ['Monetization', 'Terminal Pay']);
                }

                if ($hasIncludeInPayroll) {
                    $record['include_in_payroll'] = in_array($type['name'], ['Monetization', 'Terminal Pay']);
                }

                if ($hasRequiresApproval) {
                    $record['requires_approval'] = true;
                }

                if ($hasCreatedBy) {
                    $record['created_by'] = 1;
                }

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
                $refRecord = $type;
                if ($hasCreatedBy) {
                    $refRecord['created_by'] = 1;
                }

                ReferenceType::firstOrCreate(['name' => $type['name']], $refRecord);
            }
        });
    }
}
