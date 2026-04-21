<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Salary;
use App\Models\SourceOfFundCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function employeesBySourceOfFund(Request $request)
    {
        $sourceOfFundCodes = SourceOfFundCode::where('status', true)->orderBy('code')->get();

        // Get available years for the selected source of fund (or all if none selected)
        $availableYears = [];
        if ($request->input('source_of_fund_code_id')) {
            $availableYears = Salary::query()
                ->where('source_of_fund_code_id', $request->input('source_of_fund_code_id'))
                ->selectRaw('DISTINCT YEAR(effective_date) as year')
                ->orderBy('year', 'desc')
                ->pluck('year')
                ->toArray();
        }

        // Only show employees when a source of fund code is selected
        $employees = Employee::with(['office', 'employmentStatus'])
            ->orderBy('last_name', 'asc')
            ->orderBy('first_name', 'asc')
            ->orderBy('middle_name', 'asc')
            ->when($request->input('source_of_fund_code_id'), function ($query) use ($request) {
                $query->whereHas('salaries', function ($query) use ($request) {
                    $query->where('source_of_fund_code_id', $request->input('source_of_fund_code_id'));

                    // Only apply year filter if provided and not empty
                    if ($request->input('year') && $request->input('year') !== '') {
                        $query->whereYear('effective_date', $request->input('year'));
                    }

                    // Only apply month filter if provided and not empty
                    if ($request->input('month') && $request->input('month') !== '' && $request->input('month') !== '00') {
                        $query->whereMonth('effective_date', $request->input('month'));
                    }
                })
                    ->with(['salaries' => function ($query) use ($request) {
                        $query->where('source_of_fund_code_id', $request->input('source_of_fund_code_id'));

                        if ($request->input('year') && $request->input('year') !== '') {
                            $query->whereYear('effective_date', $request->input('year'));
                        }

                        if ($request->input('month') && $request->input('month') !== '' && $request->input('month') !== '00') {
                            $query->whereMonth('effective_date', $request->input('month'));
                        }

                        $query->orderBy('effective_date', 'desc');
                    }]);
            }, function ($query) {
                // If no source of fund selected, return empty results
                $query->whereRaw('1 = 0');
            })
            ->paginate(50)
            ->withQueryString();

        // Add salary amount to each employee
        $employees->getCollection()->transform(function ($employee) use ($request) {
            if ($request->input('source_of_fund_code_id') && $employee->salaries->count() > 0) {
                $employee->salary_amount = $employee->salaries->first()->amount;
                $employee->salary_effective_date = $employee->salaries->first()->effective_date;
            } else {
                $employee->salary_amount = null;
                $employee->salary_effective_date = null;
            }
            unset($employee->salaries);
            return $employee;
        });

        return Inertia::render('reports/EmployeesBySourceOfFund', [
            'sourceOfFundCodes' => $sourceOfFundCodes,
            'employees' => $employees,
            'filters' => [
                'source_of_fund_code_id' => $request->input('source_of_fund_code_id'),
                'month' => $request->input('month'),
                'year' => $request->input('year'),
            ],
            'availableYears' => $availableYears,
        ]);
    }



    public function employeesBySourceOfFundPrint(Request $request)
    {
        $sourceOfFundCodeId = $request->input('source_of_fund_code_id');
        $month = $request->input('month');
        $year = $request->input('year');

        if (!$sourceOfFundCodeId) {
            abort(400, 'Source of fund code is required');
        }

        // Get the source of fund code
        $sourceOfFundCode = SourceOfFundCode::findOrFail($sourceOfFundCodeId);

        // Get employee IDs who have salaries from this source of fund
        $employeeQuery = Salary::query()
            ->where('source_of_fund_code_id', $sourceOfFundCodeId);

        if ($year) {
            $employeeQuery->whereYear('effective_date', $year);
        }

        if ($month) {
            $employeeQuery->whereMonth('effective_date', $month);
        }

        $employeeIds = $employeeQuery->distinct()->pluck('employee_id');

        // Get employees with their details and salaries
        $employees = Employee::whereIn('id', $employeeIds)
            ->with(['office', 'employmentStatus'])
            ->with(['salaries' => function ($query) use ($sourceOfFundCodeId, $year, $month) {
                $query->where('source_of_fund_code_id', $sourceOfFundCodeId);

                if ($year) {
                    $query->whereYear('effective_date', $year);
                }

                if ($month) {
                    $query->whereMonth('effective_date', $month);
                }

                $query->orderBy('effective_date', 'desc');
            }])
            ->orderBy('last_name', 'asc')
            ->get();

        // Add salary amount to each employee and calculate total
        $totalSalary = 0;
        $employees = $employees->map(function ($employee) use (&$totalSalary) {
            if ($employee->salaries->count() > 0) {
                $employee->salary_amount = $employee->salaries->first()->amount;
                $totalSalary += $employee->salary_amount;
            } else {
                $employee->salary_amount = null;
            }
            unset($employee->salaries);
            return $employee;
        });

        return Inertia::render('reports/EmployeesBySourceOfFundPrint', [
            'employees' => $employees,
            'sourceOfFundCode' => $sourceOfFundCode,
            'totalSalary' => $totalSalary,
            'filters' => [
                'month' => $month,
                'year' => $year,
            ],
        ]);
    }
}
