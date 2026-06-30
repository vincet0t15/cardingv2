<?php

namespace App\Ai\Tools;

use App\Models\Claim;
use App\Models\ClaimType;
use App\Models\DeductionType;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use App\Models\Office;
use App\Models\Pera;
use App\Models\Rata;
use App\Models\Salary;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\DB;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class PayrollQueryTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Query payroll data: employees, salaries, PERA, RATA, claims, deductions, offices. Supports totals, counts, top lists, and filtered queries by month/year.';
    }

    public function handle(Request $request): Stringable|string
    {
        $query = $request['query'];
        $month = $request['month'] ?? null;
        $year = $request['year'] ?? now()->year;

        return match ($query) {
            'total_salaries' => $this->totalSalaries(),
            'total_pera' => $this->totalPera(),
            'total_rata' => $this->totalRata(),
            'total_compensation' => $this->totalCompensation(),
            'employee_count' => $this->employeeCount($request),
            'office_count' => (string) Office::count(),
            'total_claims' => $this->totalClaims($month, $year),
            'total_deductions' => $this->totalDeductions($month, $year),
            'top_claimants' => $this->topClaimants($month, $year),
            'top_deductions' => $this->topDeductions($month, $year),
            'top_travel_claims' => $this->topTravelClaims($month, $year),
            'claims_by_type' => $this->claimsByType($month, $year),
            'employees_by_office' => $this->employeesByOffice(),
            'monthly_payroll_cost' => $this->monthlyPayrollCost(),
            default => "Unknown query: $query. Available queries: total_salaries, total_pera, total_rata, total_compensation, employee_count, office_count, total_claims, total_deductions, top_claimants, top_deductions, top_travel_claims, claims_by_type, employees_by_office, monthly_payroll_cost",
        };
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()
                ->required()
                ->description('The type of query to run'),
            'month' => $schema->integer()
                ->description('Month number (1-12, optional)'),
            'year' => $schema->integer()
                ->description('Year (optional, defaults to current year)'),
        ];
    }

    private function totalSalaries(): string
    {
        $total = Salary::sum('amount');
        return "Total salaries (monthly): ₱" . number_format($total, 2);
    }

    private function totalPera(): string
    {
        $total = Pera::sum('amount');
        return "Total PERA (monthly): ₱" . number_format($total, 2);
    }

    private function totalRata(): string
    {
        $total = Rata::sum('amount');
        return "Total RATA (monthly): ₱" . number_format($total, 2);
    }

    private function totalCompensation(): string
    {
        $salaries = Salary::sum('amount');
        $pera = Pera::sum('amount');
        $rata = Rata::sum('amount');
        $total = $salaries + $pera + $rata;
        return "Total monthly compensation: ₱" . number_format($total, 2) . " (Salaries: ₱" . number_format($salaries, 2) . ", PERA: ₱" . number_format($pera, 2) . ", RATA: ₱" . number_format($rata, 2) . ")";
    }

    private function employeeCount(Request $request): string
    {
        $officeId = $request->input('office_id');
        $statusId = $request->input('employment_status_id');

        $query = Employee::query();
        if ($officeId) {
            $query->where('office_id', $officeId);
        }
        if ($statusId) {
            $query->where('employment_status_id', $statusId);
        }

        $count = $query->count();
        $label = 'Total employees';
        if ($officeId) {
            $office = Office::find($officeId);
            $label .= " in {$office?->name}";
        }

        return "$label: $count";
    }

    private function totalClaims($month, $year): string
    {
        $query = Claim::query();
        if ($month) {
            $query->whereMonth('claim_date', $month)->whereYear('claim_date', $year);
        } else {
            $query->whereYear('claim_date', $year);
        }

        $count = $query->count();
        $total = $query->sum('amount');
        $period = $month ? "for " . now()->month($month)->format('F') . " $year" : "for $year";

        return "Total claims $period: $count claims, ₱" . number_format($total, 2);
    }

    private function totalDeductions($month, $year): string
    {
        $query = EmployeeDeduction::query();
        if ($month) {
            $query->where('pay_period_month', $month)->where('pay_period_year', $year);
        }

        $count = $query->count();
        $total = $query->sum('amount');
        $period = $month ? "for " . now()->month($month)->format('F') . " $year" : "for $year";

        return "Total deductions $period: $count entries, ₱" . number_format($total, 2);
    }

    private function topClaimants($month, $year): string
    {
        $query = Claim::selectRaw('employee_id, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('employee_id')
            ->orderByDesc('total');

        if ($month) {
            $query->whereMonth('claim_date', $month)->whereYear('claim_date', $year);
        } else {
            $query->whereYear('claim_date', $year);
        }

        $results = $query->with('employee')->limit(5)->get();

        if ($results->isEmpty()) {
            return 'No claims data found.';
        }

        $lines = ['Top 5 employees by claims:'];
        foreach ($results as $i => $r) {
            $name = $r->employee->last_name . ', ' . $r->employee->first_name;
            $lines[] = ($i + 1) . ". $name - ₱" . number_format($r->total, 2) . " ($r->count claims)";
        }

        return implode("\n", $lines);
    }

    private function topDeductions($month, $year): string
    {
        $query = EmployeeDeduction::selectRaw('deduction_type_id, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('deduction_type_id')
            ->orderByDesc('total');

        if ($month) {
            $query->where('pay_period_month', $month)->where('pay_period_year', $year);
        }

        $results = $query->with('deductionType')->limit(5)->get();

        if ($results->isEmpty()) {
            return 'No deduction data found.';
        }

        $lines = ['Top 5 deduction types:'];
        foreach ($results as $i => $r) {
            $lines[] = ($i + 1) . ". {$r->deductionType->name} - ₱" . number_format($r->total, 2) . " ($r->count entries)";
        }

        return implode("\n", $lines);
    }

    private function topTravelClaims($month, $year): string
    {
        $query = Claim::whereHas('claimType', fn($q) => $q->where('code', 'TRAVEL'))
            ->selectRaw('employee_id, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('employee_id')
            ->orderByDesc('total');

        if ($month) {
            $query->whereMonth('claim_date', $month)->whereYear('claim_date', $year);
        } else {
            $query->whereYear('claim_date', $year);
        }

        $results = $query->with('employee')->limit(5)->get();

        if ($results->isEmpty()) {
            return 'No travel claims data found.';
        }

        $lines = ['Top 5 employees by travel claims:'];
        foreach ($results as $i => $r) {
            $name = $r->employee->last_name . ', ' . $r->employee->first_name;
            $lines[] = ($i + 1) . ". $name - ₱" . number_format($r->total, 2) . " ($r->count trips)";
        }

        return implode("\n", $lines);
    }

    private function claimsByType($month, $year): string
    {
        $query = Claim::selectRaw('claim_type_id, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('claim_type_id');

        if ($month) {
            $query->whereMonth('claim_date', $month)->whereYear('claim_date', $year);
        } else {
            $query->whereYear('claim_date', $year);
        }

        $results = $query->with('claimType')->orderByDesc('total')->get();

        if ($results->isEmpty()) {
            return 'No claims data found.';
        }

        $lines = ['Claims by type:'];
        foreach ($results as $r) {
            $lines[] = "- {$r->claimType->name} ({$r->claimType->code}): $r->count claims, ₱" . number_format($r->total, 2);
        }

        return implode("\n", $lines);
    }

    private function employeesByOffice(): string
    {
        $offices = Office::withCount('employees')->orderByDesc('employees_count')->get();

        $lines = ['Employees by office:'];
        foreach ($offices as $o) {
            $lines[] = "- {$o->name}: {$o->employees_count} employees";
        }

        return implode("\n", $lines);
    }

    private function monthlyPayrollCost(): string
    {
        $salaries = Salary::sum('amount');
        $pera = Pera::sum('amount');
        $rata = Rata::sum('amount');
        $employees = Employee::count();

        return "Monthly payroll cost: ₱" . number_format($salaries + $pera + $rata, 2)
            . " ($employees employees)"
            . " | Breakdown: Salaries ₱" . number_format($salaries, 2)
            . ", PERA ₱" . number_format($pera, 2)
            . ", RATA ₱" . number_format($rata, 2);
    }
}
