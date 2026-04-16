<?php

namespace App\Services;

use Illuminate\Support\Collection;

class PayrollService
{
    /**
     * Get effective amount for records with effective_date (salary, pera, rata)
     */
    public function getEffectiveAmount(Collection $history, int $year, int $month): float
    {
        if ($history->isEmpty()) {
            return 0;
        }

        $periodEnd = now()->setDate($year, $month, 1)->endOfMonth();

        $effectiveRecord = $history
            ->sortByDesc('effective_date')
            ->first(fn($record) => $record->effective_date <= $periodEnd);

        if (! $effectiveRecord) {
            $effectiveRecord = $history->sortBy('effective_date')->first();
        }

        return (float) ($effectiveRecord?->amount ?? 0);
    }

    /**
     * Get effective amount for records with date range (hazard pay, clothing allowance)
     * Checks if the given month/year falls within start_date and end_date range
     */
    public function getEffectiveAmountForDateRange(Collection $history, int $year, int $month): float
    {
        if ($history->isEmpty()) {
            return 0;
        }

        $periodStart = now()->setDate($year, $month, 1)->startOfMonth();
        $periodEnd = now()->setDate($year, $month, 1)->endOfMonth();

        // Find records where the period falls within start_date and end_date range
        $effectiveRecord = $history
            ->filter(function ($record) use ($periodStart, $periodEnd) {
                // Record is active if:
                // 1. start_date <= end of period AND
                // 2. (end_date >= start of period OR end_date is null)
                $startDate = $record->start_date ?? $record->effective_date ?? null;
                $endDate = $record->end_date;

                if (!$startDate) {
                    return false;
                }

                $isActive = $startDate <= $periodEnd;

                if ($endDate) {
                    $isActive = $isActive && ($endDate >= $periodStart);
                }

                return $isActive;
            })
            ->sortByDesc('start_date')
            ->first();

        return (float) ($effectiveRecord?->amount ?? 0);
    }

    public function calculatePayroll($employee, int $year, int $month): array
    {
        $salary = $this->getEffectiveAmount($employee->salaries, $year, $month);
        $pera = $this->getEffectiveAmount($employee->peras, $year, $month);
        $rata = $employee->is_rata_eligible ? $this->getEffectiveAmount($employee->ratas, $year, $month) : 0;

        // Use date range logic for hazard pay and clothing allowance
        $hazardPay = $this->getEffectiveAmountForDateRange($employee->hazardPays, $year, $month);
        $clothingAllowance = $this->getEffectiveAmountForDateRange($employee->clothingAllowances, $year, $month);

        $totalDeductions = (float) $employee->deductions
            ->where('pay_period_month', $month)
            ->where('pay_period_year', $year)
            ->sum('amount');
        // Sum adjustments for the given pay period (can be positive or negative)
        $adjustments = (float) $employee->adjustments()
            ->where('pay_period_month', $month)
            ->where('pay_period_year', $year)
            ->sum('amount');
        $grossPay = $salary + $pera + $rata + $hazardPay + $clothingAllowance;
        // Include adjustments into the final net pay calculation
        $netPay = $grossPay - $totalDeductions + $adjustments;

        return [
            'salary' => $salary,
            'pera' => $pera,
            'rata' => $rata,
            'hazard_pay' => $hazardPay,
            'clothing_allowance' => $clothingAllowance,
            'total_deductions' => $totalDeductions,
            'adjustments' => $adjustments,
            'gross_pay' => $grossPay,
            'net_pay' => $netPay,
        ];
    }
}
