<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Office;
use App\Models\SourceOfFundCode;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeSourceOfFundController extends Controller
{
    /**
     * Display employees grouped by source of fund code
     */
    public function index(Request $request)
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month');
        $officeId = $request->input('office_id');
        $sourceOfFundCodeId = $request->input('source_of_fund_code_id');

        // Get all active source of fund codes
        $sourceOfFundCodes = SourceOfFundCode::where('status', true)
            ->orderBy('code')
            ->get();

        // Get offices for filter dropdown
        $offices = Office::orderBy('name')->get();

        // Get employees with their compensation and source of fund
        $employeesQuery = Employee::query()
            ->with(['employmentStatus', 'office', 'salaries', 'peras', 'ratas'])
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->orderBy('last_name', 'asc');

        // If specific source of fund is selected, filter employees who have salary from that fund
        if ($sourceOfFundCodeId) {
            $employeeIds = Employee::query()
                ->join('salaries', 'employees.id', '=', 'salaries.employee_id')
                ->where('salaries.source_of_fund_code_id', $sourceOfFundCodeId)
                ->pluck('employees.id');

            $employeesQuery->whereIn('id', $employeeIds);
        }

        $employees = $employeesQuery->paginate(50)->withQueryString();

        $periodEnd = $month ? now()->setDate($year, $month, 1)->endOfMonth() : now()->setDate($year, 12, 31);

        $employees->getCollection()->transform(function ($employee) use ($periodEnd) {
            $salary = $employee->salaries
                ->where('effective_date', '<=', $periodEnd)
                ->sortByDesc('effective_date')
                ->first();

            $pera = $employee->peras
                ->where('effective_date', '<=', $periodEnd)
                ->sortByDesc('effective_date')
                ->first();

            $rata = $employee->is_rata_eligible
                ? $employee->ratas
                ->where('effective_date', '<=', $periodEnd)
                ->sortByDesc('effective_date')
                ->first()
                : null;

            $fundingSources = [];

            if ($salary) {
                $fundCode = $salary->sourceOfFundCode?->code ?? 'Unfunded';
                if (! isset($fundingSources[$fundCode])) {
                    $fundingSources[$fundCode] = [
                        'salary' => 0,
                        'pera' => 0,
                        'rata' => 0,
                        'total' => 0,
                    ];
                }
                $fundingSources[$fundCode]['salary'] += (float) $salary->amount;
                $fundingSources[$fundCode]['total'] += (float) $salary->amount;
            }

            if ($pera) {
                if (! isset($fundingSources['Unfunded'])) {
                    $fundingSources['Unfunded'] = [
                        'salary' => 0,
                        'pera' => 0,
                        'rata' => 0,
                        'total' => 0,
                    ];
                }
                $fundingSources['Unfunded']['pera'] += (float) $pera->amount;
                $fundingSources['Unfunded']['total'] += (float) $pera->amount;
            }

            if ($rata) {
                if (! isset($fundingSources['Unfunded'])) {
                    $fundingSources['Unfunded'] = [
                        'salary' => 0,
                        'pera' => 0,
                        'rata' => 0,
                        'total' => 0,
                    ];
                }
                $fundingSources['Unfunded']['rata'] += (float) $rata->amount;
                $fundingSources['Unfunded']['total'] += (float) $rata->amount;
            }

            $employee->funding_sources = $fundingSources;
            $employee->total_compensation = array_sum(array_column($fundingSources, 'total'));

            return $employee;
        });

        // Calculate summary statistics
        $employeesByFund = [];
        foreach ($employees as $employee) {
            foreach ($employee->funding_sources as $fundCode => $amounts) {
                if (! isset($summary['by_fund'][$fundCode])) {
                    $summary['by_fund'][$fundCode] = [
                        'count' => 0,
                        'total' => 0,
                    ];
                }
                $summary['by_fund'][$fundCode]['count']++;
                $summary['by_fund'][$fundCode]['total'] += $amounts['total'];

                if (! isset($employeesByFund[$fundCode])) {
                    $employeesByFund[$fundCode] = [];
                }
                $employeesByFund[$fundCode][] = [
                    'id' => $employee->id,
                    'first_name' => $employee->first_name,
                    'middle_name' => $employee->middle_name,
                    'last_name' => $employee->last_name,
                    'suffix' => $employee->suffix,
                    'position' => $employee->position,
                    'office' => $employee->office ? ['name' => $employee->office->name] : null,
                    'employment_status' => $employee->employmentStatus ? ['name' => $employee->employmentStatus->name] : null,
                    'total_compensation' => $employee->total_compensation,
                ];
            }
        }

        return Inertia::render('employees/SourceOfFund/Index', [
            'employees' => $employees,
            'sourceOfFundCodes' => $sourceOfFundCodes,
            'offices' => $offices,
            'filters' => [
                'year' => (int) $year,
                'month' => $month ? (int) $month : null,
                'office_id' => $officeId,
                'source_of_fund_code_id' => $sourceOfFundCodeId,
            ],
            'summary' => $summary,
            'employeesByFund' => $employeesByFund,
        ]);
    }
}
