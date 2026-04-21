<?php

namespace App\Http\Controllers;

use App\Models\ClothingAllowance;
use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\Office;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClothingAllowanceController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', ClothingAllowance::class);
        $search = $request->input('search');
        $officeId = $request->input('office_id');
        $employmentStatusId = $request->input('employment_status_id');
        $month = $request->input('month');
        $year = $request->input('year');

        $employees = Employee::query()
            ->when($month && $year, function ($query) use ($month, $year) {
                // If month/year filter is applied, only show employees with clothing allowances in that period
                $query->whereHas('clothingAllowances', function ($q) use ($month, $year) {
                    $periodStart = now()->setDate($year, $month, 1)->startOfMonth();
                    $periodEnd = now()->setDate($year, $month, 1)->endOfMonth();
                    $q->where('start_date', '<=', $periodEnd)
                        ->where(function ($query) use ($periodStart) {
                            $query->whereNull('end_date')
                                ->orWhere('end_date', '>=', $periodStart);
                        });
                });
            }, function ($query) {
                // If no month/year filter, show all employees who have ANY clothing allowance record
                $query->has('clothingAllowances');
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
            ->with(['employmentStatus', 'office', 'latestClothingAllowance'])
            ->orderBy('last_name', 'asc')
            ->paginate(50)
            ->withQueryString();

        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();

        return Inertia::render('clothing-allowances/index', [
            'employees' => $employees,
            'offices' => $offices,
            'employmentStatuses' => $employmentStatuses,
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
        $this->authorize('viewAny', ClothingAllowance::class);
        $month = $request->input('month');
        $year = $request->input('year');

        $employees = Employee::query()
            ->has('clothingAllowances')
            ->when($month && $year, function ($query) use ($month, $year) {
                $query->whereHas('clothingAllowances', function ($q) use ($month, $year) {
                    $periodStart = now()->setDate($year, $month, 1)->startOfMonth();
                    $periodEnd = now()->setDate($year, $month, 1)->endOfMonth();
                    $q->where('start_date', '<=', $periodEnd)
                        ->where(function ($query) use ($periodStart) {
                            $query->whereNull('end_date')
                                ->orWhere('end_date', '>=', $periodStart);
                        });
                });
            })
            ->with(['office', 'latestClothingAllowance'])
            ->orderBy('last_name', 'asc')
            ->get();

        $totalClothingAllowance = $employees->sum(function ($employee) {
            return $employee->latest_clothing_allowance ? (float) $employee->latest_clothing_allowance->amount : 0;
        });

        return Inertia::render('clothing-allowances/print', [
            'employees' => $employees,
            'month' => $month,
            'year' => $year,
            'totalClothingAllowance' => $totalClothingAllowance,
        ]);
    }

    public function history(Request $request, Employee $employee)
    {
        $this->authorize('viewAny', ClothingAllowance::class);
        $clothingAllowances = $employee->clothingAllowances()
            ->with('createdBy')
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('clothing-allowances/history', [
            'employee' => $employee->load(['employmentStatus', 'office']),
            'clothingAllowances' => $clothingAllowances,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', ClothingAllowance::class);
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'source_of_fund_code_id' => 'nullable|exists:source_of_fund_codes,id',
        ]);

        ClothingAllowance::create([
            'employee_id' => $validated['employee_id'],
            'amount' => $validated['amount'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'source_of_fund_code_id' => $validated['source_of_fund_code_id'] ?? null,
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Clothing Allowance added successfully');
    }

    public function update(Request $request, ClothingAllowance $clothingAllowance)
    {
        $this->authorize('update', $clothingAllowance);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'source_of_fund_code_id' => 'nullable|exists:source_of_fund_codes,id',
        ]);

        $clothingAllowance->update([
            'amount' => $validated['amount'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'source_of_fund_code_id' => $validated['source_of_fund_code_id'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Clothing Allowance record updated successfully');
    }

    public function destroy(ClothingAllowance $clothingAllowance)
    {
        $this->authorize('delete', $clothingAllowance);
        $clothingAllowance->delete();

        return redirect()->back()->with('success', 'Clothing Allowance record deleted successfully');
    }
}
