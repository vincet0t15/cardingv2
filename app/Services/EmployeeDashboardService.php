<?php

namespace App\Services;

use App\Models\Adjustment;
use App\Models\Claim;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class EmployeeDashboardService
{
    public function __construct(
        private PayrollService $payrollService
    ) {}

    /**
     * Get comprehensive employee dashboard data.
     */
    public function getDashboardData(Employee $employee, ?int $filterMonth, ?int $filterYear): array
    {
        $employee->load([
            'office',
            'employmentStatus',
            'latestSalary',
            'latestPera',
            'latestRata',
            'latestHazardPay',
            'latestClothingAllowance',
            'salaries' => fn($q) => $q->orderBy('effective_date', 'desc')->with('sourceOfFundCode'),
            'peras' => fn($q) => $q->orderBy('effective_date', 'desc'),
            'ratas' => fn($q) => $q->orderBy('effective_date', 'desc'),
            'hazardPays' => fn($q) => $q->orderBy('start_date', 'desc'),
            'clothingAllowances' => fn($q) => $q->orderBy('start_date', 'desc'),
        ]);

        return [
            'employee' => $employee,
            'deductions' => $this->getDeductions($employee, $filterMonth, $filterYear),
            'claims' => $this->getClaims($employee, $filterMonth, $filterYear),
            'adjustments' => $this->getAdjustments($employee, $filterMonth, $filterYear),
            'availableYears' => $this->getAvailableYears($employee),
            'totals' => $this->getTotals($employee, $filterMonth, $filterYear),
            'payrollSummary' => $this->getPayrollSummaries($employee, $filterMonth, $filterYear),
        ];
    }

    /**
     * Get a payroll breakdown for a specific period using backend PayrollService.
     * Falls back to latest amounts when no effective record exists for the period.
     */
    public function getPayrollForPeriod(Employee $employee, int $year, int $month): array
    {
        $salary = $this->payrollService->getEffectiveAmount(collect($employee->salaries ?? []), $year, $month);
        if ($salary === 0.0) {
            $salary = (float) ($employee->latestSalary?->amount ?? 0);
        }

        $pera = $this->payrollService->getEffectiveAmount(collect($employee->peras ?? []), $year, $month);
        if ($pera === 0.0) {
            $pera = (float) ($employee->latestPera?->amount ?? 0);
        }

        $rata = $employee->is_rata_eligible
            ? $this->payrollService->getEffectiveAmount(collect($employee->ratas ?? []), $year, $month)
            : 0;
        if ($rata === 0.0 && $employee->is_rata_eligible) {
            $rata = (float) ($employee->latestRata?->amount ?? 0);
        }

        $hazardPay = $this->payrollService->getEffectiveAmountForDateRange(collect($employee->hazardPays ?? []), $year, $month);
        if ($hazardPay === 0.0) {
            $hazardPay = (float) ($employee->latestHazardPay?->amount ?? 0);
        }

        $clothing = $this->payrollService->getEffectiveAmountForDateRange(collect($employee->clothingAllowances ?? []), $year, $month);
        if ($clothing === 0.0) {
            $clothing = (float) ($employee->latestClothingAllowance?->amount ?? 0);
        }

        $grossPay = $salary + $pera + $rata + $hazardPay + $clothing;

        $deductions = EmployeeDeduction::where('employee_id', $employee->id)
            ->where('pay_period_year', $year)
            ->where('pay_period_month', $month)
            ->with('deductionType')
            ->get();

        $totalDeductions = (float) $deductions->sum('amount');

        $adjustments = Adjustment::where('employee_id', $employee->id)
            ->where('pay_period_year', $year)
            ->where('pay_period_month', $month)
            ->where('status', '!=', 'rejected')
            ->get();

        $totalAdjustments = (float) $adjustments->sum('amount');

        $netPay = $grossPay - $totalDeductions + $totalAdjustments;

        return [
            'period' => ['year' => $year, 'month' => $month],
            'salary' => $salary,
            'pera' => $pera,
            'rata' => $rata,
            'hazardPay' => $hazardPay,
            'clothingAllowance' => $clothing,
            'grossPay' => $grossPay,
            'totalDeductions' => $totalDeductions,
            'totalAdjustments' => $totalAdjustments,
            'netPay' => $netPay,
            'deductions' => $deductions,
            'adjustments' => $adjustments,
        ];
    }

    /**
     * Get payroll summaries for all periods (for the dashboard).
     */
    private function getPayrollSummaries(Employee $employee, ?int $filterMonth, ?int $filterYear): array
    {
        $allPeriods = $this->getAllPeriods($employee);
        $summaries = [];

        foreach ($allPeriods as $period) {
            [$year, $month] = explode('-', $period);
            $year = (int) $year;
            $month = (int) ltrim($month, '0');

            if ($filterMonth && $month !== $filterMonth) continue;
            if ($filterYear && $year !== $filterYear) continue;

            $summaries[$period] = $this->getPayrollForPeriod($employee, $year, $month);
        }

        return $summaries;
    }

    private function getAllPeriods(Employee $employee): array
    {
        $periods = [];

        // Periods from deduction records
        $dedPeriods = EmployeeDeduction::where('employee_id', $employee->id)
            ->select('pay_period_year', 'pay_period_month')
            ->distinct()
            ->get();

        foreach ($dedPeriods as $d) {
            $periods[] = $d->pay_period_year . '-' . str_pad($d->pay_period_month, 2, '0', STR_PAD_LEFT);
        }

        // Periods from claim records
        $claimPeriods = Claim::where('employee_id', $employee->id)
            ->whereNotNull('claim_date')
            ->get()
            ->map(fn($c) => Carbon::parse($c->claim_date)->format('Y-m'));

        foreach ($claimPeriods as $p) {
            $periods[] = $p;
        }

        // Periods from adjustment records
        $adjPeriods = Adjustment::where('employee_id', $employee->id)
            ->whereNotNull('pay_period_year')
            ->whereNotNull('pay_period_month')
            ->get()
            ->map(fn($a) => $a->pay_period_year . '-' . str_pad($a->pay_period_month, 2, '0', STR_PAD_LEFT));

        foreach ($adjPeriods as $p) {
            $periods[] = $p;
        }

        // Also include periods from salary history
        foreach ($employee->salaries ?? [] as $s) {
            $date = Carbon::parse($s->effective_date);
            $periods[] = $date->format('Y-m');
        }

        // Also include periods from PERA history
        foreach ($employee->peras ?? [] as $p) {
            $date = Carbon::parse($p->effective_date);
            $periods[] = $date->format('Y-m');
        }

        // Also include periods from RATA history
        foreach ($employee->ratas ?? [] as $r) {
            $date = Carbon::parse($r->effective_date);
            $periods[] = $date->format('Y-m');
        }

        return collect($periods)->unique()->sort()->reverse()->values()->toArray();
    }

    private function getDeductions(Employee $employee, ?int $month, ?int $year): Collection
    {
        $query = EmployeeDeduction::where('employee_id', $employee->id)->with('deductionType');

        if ($month) $query->where('pay_period_month', $month);
        if ($year) $query->where('pay_period_year', $year);

        return $query->orderBy('pay_period_year', 'desc')
            ->orderBy('pay_period_month', 'desc')
            ->limit(200)
            ->get();
    }

    private function getClaims(Employee $employee, ?int $month, ?int $year): Collection
    {
        $query = Claim::where('employee_id', $employee->id)->with('claimType');

        if ($month) $query->whereMonth('claim_date', $month);
        if ($year) $query->whereYear('claim_date', $year);

        return $query->orderBy('claim_date', 'desc')->limit(200)->get();
    }

    private function getAdjustments(Employee $employee, ?int $month, ?int $year): Collection
    {
        $query = Adjustment::where('employee_id', $employee->id)
            ->with(['adjustmentType', 'referenceType']);

        if ($month) $query->where('pay_period_month', $month);
        if ($year) $query->where('pay_period_year', $year);

        return $query->orderBy('created_at', 'desc')->limit(200)->get();
    }

    private function getAvailableYears(Employee $employee): array
    {
        $dedYears = EmployeeDeduction::where('employee_id', $employee->id)
            ->select('pay_period_year')->distinct()->pluck('pay_period_year');

        $claimYears = Claim::where('employee_id', $employee->id)
            ->get()->map(fn($c) => Carbon::parse($c->claim_date)->year)->unique();

        $adjYears = Adjustment::where('employee_id', $employee->id)
            ->select('pay_period_year')->distinct()->pluck('pay_period_year');

        return collect()
            ->merge($dedYears)->merge($claimYears)->merge($adjYears)
            ->filter()->unique()->sort()->reverse()->values()->toArray();
    }

    private function getTotals(Employee $employee, ?int $month, ?int $year): array
    {
        $dedQuery = EmployeeDeduction::where('employee_id', $employee->id);
        $claimQuery = Claim::where('employee_id', $employee->id);
        $adjQuery = Adjustment::where('employee_id', $employee->id);

        if ($month) {
            $dedQuery->where('pay_period_month', $month);
            $adjQuery->where('pay_period_month', $month);
            $claimQuery->whereMonth('claim_date', $month);
        }
        if ($year) {
            $dedQuery->where('pay_period_year', $year);
            $adjQuery->where('pay_period_year', $year);
            $claimQuery->whereYear('claim_date', $year);
        }

        return [
            'totalDeductions' => (float) $dedQuery->sum('amount'),
            'totalClaims' => (float) $claimQuery->sum('amount'),
            'totalAdjustments' => (float) $adjQuery->sum('amount'),
            'deductionCount' => $dedQuery->count(),
            'claimCount' => $claimQuery->count(),
            'adjustmentCount' => $adjQuery->count(),
        ];
    }
}
