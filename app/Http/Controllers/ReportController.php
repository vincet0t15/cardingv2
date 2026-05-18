<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeStatus;
use App\Models\EmploymentStatus;
use App\Models\Office;
use App\Models\Salary;
use App\Models\SourceOfFundCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function employeesBySourceOfFund(Request $request)
    {
        $filterSourceOfFund = $request->input('source_of_fund_code_id');
        $filterOffice = $request->input('office_id');
        $filterEmploymentStatus = $request->input('employment_status_id');
        $filterSearch = $request->input('search');
        $filterYear = $request->input('year', now()->year);

        $sourceOfFundCodes = SourceOfFundCode::where('status', true)->orderBy('code')->get();
        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmployeeStatus::orderBy('name')->get();

        $employeesQuery = Employee::query()
            ->with(['office', 'employmentStatus', 'latestSalary.sourceOfFundCode'])
            ->when($filterSourceOfFund, function ($query) use ($filterSourceOfFund, $filterYear) {
                $query->whereHas('salaries', function ($q) use ($filterSourceOfFund, $filterYear) {
                    $q->where('source_of_fund_code_id', $filterSourceOfFund);
                    if ($filterYear) {
                        $q->whereYear('effective_date', $filterYear);
                    }
                });
            })
            ->when($filterOffice, function ($query) use ($filterOffice) {
                $query->where('office_id', $filterOffice);
            })
            ->when($filterEmploymentStatus, function ($query) use ($filterEmploymentStatus) {
                $query->where('employment_status_id', $filterEmploymentStatus);
            })
            ->when($filterSearch, function ($query) use ($filterSearch) {
                $query->where(function ($q) use ($filterSearch) {
                    $q->whereRaw("CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) LIKE ?", ["%{$filterSearch}%"])
                        ->orWhere('last_name', 'LIKE', "%{$filterSearch}%")
                        ->orWhere('first_name', 'LIKE', "%{$filterSearch}%");
                });
            })
            ->orderBy('last_name', 'asc')
            ->orderBy('first_name', 'asc');

        $employees = $employeesQuery->paginate(50)->withQueryString();

        $employeesWithSalary = $employees->getCollection()->map(function ($employee) use ($filterSourceOfFund, $filterYear) {
            $salary = $employee->latestSalary;
            return [
                'id' => $employee->id,
                'first_name' => $employee->first_name,
                'middle_name' => $employee->middle_name,
                'last_name' => $employee->last_name,
                'suffix' => $employee->suffix,
                'position' => $employee->position,
                'office' => $employee->office ? ['name' => $employee->office->name] : null,
                'employment_status' => $employee->employmentStatus ? ['name' => $employee->employmentStatus->name] : null,
                'source_of_fund_code' => $salary && $salary->sourceOfFundCode ? [
                    'code' => $salary->sourceOfFundCode->code,
                    'description' => $salary->sourceOfFundCode->description,
                ] : null,
                'salary_amount' => $salary ? (float) $salary->amount : null,
                'salary_effective_date' => $salary ? $salary->effective_date : null,
            ];
        });

        $employees = new \Illuminate\Pagination\LengthAwarePaginator(
            $employeesWithSalary,
            $employees->total(),
            $employees->perPage(),
            $employees->currentPage(),
            ['path' => $employees->path()]
        );

        return Inertia::render('reports/EmployeesBySourceOfFund', [
            'sourceOfFundCodes' => $sourceOfFundCodes,
            'employees' => $employees,
            'offices' => $offices,
            'employmentStatuses' => $employmentStatuses,
            'filters' => [
                'source_of_fund_code_id' => $filterSourceOfFund,
                'office_id' => $filterOffice,
                'employment_status_id' => $filterEmploymentStatus,
                'search' => $filterSearch,
                'year' => $filterYear,
            ],
        ]);
    }



    public function employeesBySourceOfFundPrint(Request $request)
    {
        $sourceOfFundCodeId = $request->input('source_of_fund_code_id');
        $year = $request->input('year');

        $sourceOfFundCode = $sourceOfFundCodeId ? SourceOfFundCode::findOrFail($sourceOfFundCodeId) : null;

        $employeesQuery = Employee::query()
            ->with(['office', 'employmentStatus', 'latestSalary.sourceOfFundCode'])
            ->when($sourceOfFundCodeId, function ($query) use ($sourceOfFundCodeId, $year) {
                $query->whereHas('salaries', function ($q) use ($sourceOfFundCodeId, $year) {
                    $q->where('source_of_fund_code_id', $sourceOfFundCodeId);
                    if ($year) {
                        $q->whereYear('effective_date', $year);
                    }
                });
            })
            ->orderBy('last_name', 'asc')
            ->orderBy('first_name', 'asc');

        $employees = $employeesQuery->get();

        $totalSalary = 0;
        $employees = $employees->map(function ($employee) use (&$totalSalary) {
            $salary = $employee->latestSalary;
            if ($salary) {
                $totalSalary += (float) $salary->amount;
            }
            return [
                'id' => $employee->id,
                'first_name' => $employee->first_name,
                'middle_name' => $employee->middle_name,
                'last_name' => $employee->last_name,
                'suffix' => $employee->suffix,
                'position' => $employee->position,
                'office' => $employee->office ? ['name' => $employee->office->name] : null,
                'employment_status' => $employee->employmentStatus ? ['name' => $employee->employmentStatus->name] : null,
                'source_of_fund_code' => $salary && $salary->sourceOfFundCode ? [
                    'code' => $salary->sourceOfFundCode->code,
                    'description' => $salary->sourceOfFundCode->description,
                ] : null,
                'salary_amount' => $salary ? (float) $salary->amount : null,
                'salary_effective_date' => $salary ? $salary->effective_date : null,
            ];
        });

        return Inertia::render('reports/EmployeesBySourceOfFundPrint', [
            'employees' => $employees,
            'sourceOfFundCode' => $sourceOfFundCode,
            'totalSalary' => $totalSalary,
            'filters' => [
                'year' => $year,
            ],
        ]);
    }
}
