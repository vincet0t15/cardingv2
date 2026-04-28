<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\Office;
use App\Models\Salary;
use App\Models\SourceOfFundCode;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SalaryController extends Controller
{
    use HandlesDeletionRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Salary::class);
        $search = $request->input('search');
        $officeId = $request->input('office_id');
        $employmentStatusId = $request->input('employment_status_id');
        $month = $request->input('month');
        $year = $request->input('year');

        $employees = Employee::query()
            ->when($month && $year, function ($query) use ($month, $year) {
                // If month/year filter is applied, only show employees with salaries in that period
                $query->whereHas('salaries', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            }, function ($query) {
                // If no month/year filter, show all employees who have ANY salary record
                $query->has('salaries');
            })
            ->when($search, function ($query, $search) {
                $query->where('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            })
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($employmentStatusId, function ($query, $employmentStatusId) {
                $query->where('employment_status_id', $employmentStatusId);
            })
            ->with(['employmentStatus', 'office', 'latestSalary'])
            ->orderBy('last_name', 'asc')
            ->paginate(50)
            ->withQueryString();

        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();
        $sourceOfFundCodes = SourceOfFundCode::where('status', true)->orderBy('code')->get();

        return Inertia::render('salaries/index', [
            'employees' => $employees,
            'offices' => $offices,
            'employmentStatuses' => $employmentStatuses,
            'sourceOfFundCodes' => $sourceOfFundCodes,
            'filters' => [
                'search' => $search,
                'office_id' => $officeId,
                'employment_status_id' => $employmentStatusId,
                'month' => $month,
                'year' => $year,
            ],
        ]);
    }

    public function print(Request $request)
    {
        $this->authorize('viewAny', Salary::class);
        $month = $request->input('month');
        $year = $request->input('year');

        $employees = Employee::query()
            ->has('salaries')
            ->when($month && $year, function ($query) use ($month, $year) {
                $query->whereHas('salaries', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            })
            ->with(['office', 'latestSalary'])
            ->orderBy('last_name', 'asc')
            ->get();

        $totalSalary = $employees->sum(function ($employee) {
            return $employee->latest_salary ? (float) $employee->latest_salary->amount : 0;
        });

        return Inertia::render('salaries/print', [
            'employees' => $employees,
            'month' => $month,
            'year' => $year,
            'totalSalary' => $totalSalary,
        ]);
    }

    public function history(Request $request, Employee $employee)
    {
        $this->authorize('viewAny', Salary::class);
        $salaries = $employee->salaries()
            ->with('createdBy')
            ->orderBy('effective_date', 'desc')
            ->get();

        return Inertia::render('salaries/history', [
            'employee' => $employee->load(['employmentStatus', 'office']),
            'salaries' => $salaries,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Salary::class);
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'source_of_fund_code_id' => 'nullable|exists:source_of_fund_codes,id',
        ]);

        Salary::create([
            'employee_id' => $validated['employee_id'],
            'amount' => $validated['amount'],
            'effective_date' => $validated['effective_date'],
            'source_of_fund_code_id' => $validated['source_of_fund_code_id'] ?? null,
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Salary added successfully');
    }

    public function update(Request $request, Salary $salary)
    {
        $this->authorize('update', $salary);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'source_of_fund_code_id' => 'nullable|exists:source_of_fund_codes,id',
        ]);

        $salary->update([
            'amount' => $validated['amount'],
            'effective_date' => $validated['effective_date'],
            'source_of_fund_code_id' => $validated['source_of_fund_code_id'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Salary record updated successfully');
    }

    public function destroy(Salary $salary)
    {
        return $this->handleDeletion($salary, 'salaries.delete');
    }
}
