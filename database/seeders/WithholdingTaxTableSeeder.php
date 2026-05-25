<?php

namespace Database\Seeders;

use App\Models\WithholdingTaxTable;
use Illuminate\Database\Seeder;

class WithholdingTaxTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * BIR Withholding Tax Table for 2025 (Administrative Order No. 5-2024)
     * Effective January 1, 2025
     * 
     * Monthly Compensation Tax Brackets (Tax Table 1)
     */
    public function run(): void
    {
        // Clear existing data
        WithholdingTaxTable::truncate();

        // 2025 BIR Withholding Tax Brackets
        // Format: [salary_from, salary_to, base_tax, percentage_over, excess_threshold, bracket_name]
        $brackets = [
            // Taxable income not over ₱20,208 - EXEMPT
            [0, 20208, 0, 0, 0, 'A - Exempt'],
            
            // ₱20,209 and over, but not over ₱33,324
            // 20% of excess over ₱20,208
            [20209, 33324, 0, 0.20, 20208, 'B1 - 20%'],
            
            // ₱33,325 and over, but not over ₱66,666
            // ₱2,623.20 + 25% of excess over ₱33,324
            [33325, 66666, 2623.20, 0.25, 33324, 'B2 - 25%'],
            
            // ₱66,667 and over, but not over ₱125,000
            // ₱10,708.20 + 30% of excess over ₱66,666
            [66667, 125000, 10708.20, 0.30, 66666, 'C1 - 30%'],
            
            // ₱125,001 and over, but not over ₱291,666
            // ₱28,008.20 + 32% of excess over ₱125,000
            [125001, 291666, 28008.20, 0.32, 125000, 'D - 32%'],
            
            // ₱291,667 and over, but not over ₱583,333
            // ₱81,321.32 + 35% of excess over ₱291,666
            [291667, 583333, 81321.32, 0.35, 291666, 'E1 - 35%'],
            
            // ₱583,334 and over
            // ₱183,354.82 + 38% of excess over ₱583,333
            [583334, null, 183354.82, 0.38, 583333, 'E2 - 38%'],
        ];

        $year = 2025;

        foreach ($brackets as $bracket) {
            WithholdingTaxTable::create([
                'salary_from' => $bracket[0],
                'salary_to' => $bracket[1],
                'base_tax' => $bracket[2],
                'percentage_over' => $bracket[3],
                'excess_threshold' => $bracket[4],
                'tax_bracket' => $bracket[5],
                'year' => $year,
                'is_active' => true,
            ]);
        }

        $this->command->info("Withholding Tax Table seeded for {$year} with " . count($brackets) . " brackets.");
    }
}