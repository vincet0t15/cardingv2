<?php

namespace Database\Seeders;

use App\Models\DeductionType;
use Illuminate\Database\Seeder;

class DeductionTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $deductionTypes = [
            [
                'name' => 'GSIS Premium',
                'code' => 'GSIS',
                'description' => 'Government Service Insurance System - Life and Retirement Insurance Premium',
                'is_active' => true,
            ],
            [
                'name' => 'GSIS Policy Loan',
                'code' => 'GSIS_PL',
                'description' => 'GSIS Policy Loan Amortization',
                'is_active' => true,
            ],
            [
                'name' => 'GSIS Emergency Loan',
                'code' => 'GSIS_EL',
                'description' => 'GSIS Emergency Loan Amortization',
                'is_active' => true,
            ],
            [
                'name' => 'PAG-IBIG Contribution',
                'code' => 'PAGIBIG',
                'description' => 'PAG-IBIG Fund Monthly Contribution',
                'is_active' => true,
            ],
            [
                'name' => 'PAG-IBIG Housing Loan',
                'code' => 'PAGIBIG_HL',
                'description' => 'PAG-IBIG Housing Loan Amortization',
                'is_active' => true,
            ],
            [
                'name' => 'PAG-IBIG MPL',
                'code' => 'PAGIBIG_MPL',
                'description' => 'PAG-IBIG Multi-Purpose Loan Amortization',
                'is_active' => true,
            ],
            [
                'name' => 'PhilHealth Contribution',
                'code' => 'PHILHEALTH',
                'description' => 'Philippine Health Insurance Corporation Monthly Contribution',
                'is_active' => true,
            ],
            [
                'name' => 'Withholding Tax',
                'code' => 'TAX',
                'description' => 'Withholding Tax on Compensation Income',
                'is_active' => true,
            ],
            [
                'name' => 'LBP Salary Loan',
                'code' => 'LBP_SL',
                'description' => 'Land Bank Salary Loan Deduction',
                'is_active' => true,
            ],
            [
                'name' => 'DBP Salary Loan',
                'code' => 'DBP_SL',
                'description' => 'Development Bank of the Philippines Salary Loan Deduction',
                'is_active' => true,
            ],
            [
                'name' => 'COOP Loan',
                'code' => 'COOP',
                'description' => 'Cooperative Loan Deduction',
                'is_active' => true,
            ],
            [
                'name' => 'Cash Advance',
                'code' => 'CA',
                'description' => 'Cash Advance Deduction',
                'is_active' => true,
            ],
            [
                'name' => 'Uniform Allowance',
                'code' => 'UNIFORM',
                'description' => 'Uniform/Clothing Allowance Deduction',
                'is_active' => true,
            ],
            [
                'name' => 'RATA Cash Advance',
                'code' => 'RATA_CA',
                'description' => 'RATA Cash Advance Deduction',
                'is_active' => true,
            ],
            [
                'name' => 'Other Deductions',
                'code' => 'OTHER',
                'description' => 'Other miscellaneous deductions',
                'is_active' => true,
            ],
        ];

        foreach ($deductionTypes as $type) {
            DeductionType::updateOrCreate(
                ['code' => $type['code']],
                $type
            );
        }

        $this->command->info('Deduction types seeded successfully!');
    }
}
