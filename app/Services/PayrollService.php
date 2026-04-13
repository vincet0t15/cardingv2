<?php

namespace App\Services;

use Illuminate\Support\Collection;

class PayrollService
{
    public function getEffectiveAmount(Collection $history, int $year, int $month): float
    {
        if ($history->isEmpty()) {
            return 0;
        }

        $periodEnd = now()->setDate($year, $month, 1)->endOfMonth();

        $effectiveRecord = $history
            ->sortByDesc('effective_date')
            ->first(fn ($record) => $record->effective_date <= $periodEnd);

        if (! $effectiveRecord) {
            $effectiveRecord = $history->sortBy('effective_date')->first();
        }

        return (float) ($effectiveRecord?->amount ?? 0);
    }

    public function calculatePayroll($employee, int $year, int $month): array
    {
        $salary = $this->getEffectiveAmount($employee->salaries, $year, $month);
        $pera = $this->getEffectiveAmount($employee->peras, $year, $month);
        $rata = $employee->is_rata_eligible ? $this->getEffectiveAmount($employee->ratas, $year, $month) : 0;

        $totalDeductions = (float) $employee->deductions
            ->where('pay_period_month', $month)
            ->where('pay_period_year', $year)
            ->sum('amount');
        $grossPay = $salary + $pera + $rata;
        $netPay = $grossPay - $totalDeductions;

        return [
            'salary' => $salary,
            'pera' => $pera,
            'rata' => $rata,
            'total_deductions' => $totalDeductions,
            'gross_pay' => $grossPay,
            'net_pay' => $netPay,
        ];
    }
}
