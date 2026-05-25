<?php

namespace App\Services;

use App\Models\WithholdingTaxTable;

class TaxCalculator
{
    /**
     * Calculate monthly withholding tax (BIR Table)
     * Uses bracket-based table lookup
     */
    public function calculateMonthlyTax(float $monthlySalary, ?int $year = null): float
    {
        if ($monthlySalary <= 0) {
            return 0;
        }

        return WithholdingTaxTable::calculateMonthlyTax($monthlySalary, $year);
    }

    /**
     * Calculate annual withholding tax
     */
    public function calculateAnnualTax(float $annualSalary, ?int $year = null): float
    {
        if ($annualSalary <= 0) {
            return 0;
        }

        return WithholdingTaxTable::calculateAnnualTax($annualSalary, $year);
    }

    /**
     * Get tax bracket info for a salary
     */
    public function getTaxBracketInfo(float $monthlySalary, ?int $year = null): ?array
    {
        $bracket = WithholdingTaxTable::getBracketForSalary($monthlySalary, $year);

        if (!$bracket) {
            return null;
        }

        $tax = $this->calculateMonthlyTax($monthlySalary, $year);
        $excess = max(0, $monthlySalary - $bracket->excess_threshold);

        return [
            'bracket' => $bracket->tax_bracket,
            'base_tax' => $bracket->base_tax,
            'percentage' => $bracket->percentage_over,
            'threshold' => $bracket->excess_threshold,
            'excess' => $excess,
            'computed_tax' => $tax,
        ];
    }

    /**
     * Calculate 13th month pay tax exemption
     * First ₱90,000 is tax-exempt, excess is taxed at graduated rates
     */
    public function calculate13thMonthPayTax(float $gross13thMonthPay): float
    {
        $taxableAmount = max(0, $gross13thMonthPay - 90000);

        if ($taxableAmount <= 0) {
            return 0;
        }

        // Tax the excess using withholding tax brackets (annual basis)
        $annualTaxable = $taxableAmount;
        return $this->calculateAnnualTax($annualTaxable) / 12;
    }

    /**
     * Calculate tax for semi-monthly payroll
     * Converts monthly tax to semi-monthly (divide by 2)
     */
    public function calculateSemiMonthlyTax(float $monthlyTax): float
    {
        return round($monthlyTax / 2, 2);
    }
}