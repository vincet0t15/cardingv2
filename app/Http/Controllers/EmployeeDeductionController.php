<?php

namespace App\Http\Controllers;

use App\Models\DeductionType;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use App\Models\EmploymentStatus;
use App\Models\Office;
use App\Services\PayrollService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeDeductionController extends Controller
{
    public function __construct(
        protected PayrollService $payrollService
    ) {}

    public function index(Request $request): Response
    {
        $month = $request->input('month'); // Can be null for "All Months"
        $year = $request->input('year', now()->year);
        $officeId = $request->input('office_id');
        $employmentStatusId = $request->input('employment_status_id');
        $search = $request->input('search');
        $hasDeductions = $request->input('has_deductions', true); // Default to show only employees with deductions

        $employees = Employee::query()
            ->with(['employmentStatus', 'office'])
            // Only show employees who have deductions for the selected period
            ->when($hasDeductions, function ($query) use ($year, $month) {
                $query->whereHas('employeeDeductions', function ($q) use ($year, $month) {
                    $q->where('pay_period_year', $year);
                    // Only filter by month if it's provided (not "All Months")
                    if ($month) {
                        $q->where('pay_period_month', $month);
                    }
                });
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
            // Load latest salary, pera, rata for display
            ->with(['latestSalary', 'latestPera', 'latestRata'])
            // Load all compensation history (ordered by date)
            ->with(['salaries' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            }])
            ->with(['peras' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            }])
            ->with(['ratas' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            }])
            // Load deductions for the selected month/year (or all months)
            ->with(['employeeDeductions' => function ($query) use ($year, $month) {
                $query->where('pay_period_year', $year)
                    ->with('deductionType')
                    ->orderBy('pay_period_month', 'asc');
                // Only filter by month if it's provided
                if ($month) {
                    $query->where('pay_period_month', $month);
                }
            }])
            // Also load as 'deductions' for frontend compatibility
            ->with(['deductions' => function ($query) use ($year, $month) {
                $query->where('pay_period_year', $year)
                    ->orderBy('created_at', 'desc');
                // Only filter by month if it's provided
                if ($month) {
                    $query->where('pay_period_month', $month);
                }
            }])
            ->orderBy('last_name')
            ->get();

        $deductionTypes = DeductionType::where('is_active', true)->orderBy('name')->get();
        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();

        return Inertia::render('EmployeeDeductions/Index', [
            'employees' => $employees,
            'deductionTypes' => $deductionTypes,
            'offices' => $offices,
            'employmentStatuses' => $employmentStatuses,
            'filters' => [
                'month' => $month,
                'year' => $year,
                'office_id' => $officeId,
                'employment_status_id' => $employmentStatusId,
                'search' => $search,
                'has_deductions' => $hasDeductions,
            ],
        ]);
    }

    /**
     * Print employee deductions report
     */
    public function print(Request $request)
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        $officeId = $request->input('office_id');
        $employmentStatusId = $request->input('employment_status_id');
        $hasDeductions = $request->input('has_deductions', true);

        $employees = Employee::query()
            ->with(['employmentStatus', 'office'])
            ->when($hasDeductions, function ($query) use ($year, $month) {
                $query->whereHas('employeeDeductions', function ($q) use ($year, $month) {
                    $q->where('pay_period_year', $year)
                        ->where('pay_period_month', $month);
                });
            })
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($employmentStatusId, function ($query, $employmentStatusId) {
                $query->where('employment_status_id', $employmentStatusId);
            })
            ->with(['salaries' => function ($query) use ($year, $month) {
                $query->where('effective_date', '<=', now()->setDate($year, $month, 1)->endOfMonth())
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['peras' => function ($query) use ($year, $month) {
                $query->where('effective_date', '<=', now()->setDate($year, $month, 1)->endOfMonth())
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['ratas' => function ($query) use ($year, $month) {
                $query->where('effective_date', '<=', now()->setDate($year, $month, 1)->endOfMonth())
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['deductions' => function ($query) use ($month, $year) {
                $query->where('pay_period_month', $month)
                    ->where('pay_period_year', $year)
                    ->with('deductionType');
            }])
            ->orderBy('last_name')
            ->get();

        $deductionTypes = DeductionType::where('is_active', true)->orderBy('name')->get();
        $officeName = $officeId ? Office::find($officeId)?->name : null;

        return Inertia::render('EmployeeDeductions/Print', [
            'employees' => $employees,
            'deductionTypes' => $deductionTypes,
            'filters' => [
                'month' => (int) $month,
                'year' => (int) $year,
                'office_id' => $officeId,
                'employment_status_id' => $employmentStatusId,
            ],
            'officeName' => $officeName,
        ]);
    }

    /**
     * Show the bulk add deduction page
     */
    // bulk add page removed

    /**
     * Show the create deduction page for a specific employee
     */
    public function create(Request $request): Response
    {
        $employeeId = $request->input('employee_id');

        if (! $employeeId) {
            abort(404, 'Employee ID is required');
        }

        $employee = Employee::with([
            'salaries' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            },
            'peras' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            },
            'ratas' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            },
        ])->findOrFail($employeeId);

        $deductionTypes = DeductionType::where('is_active', true)->orderBy('name')->get();

        // Get taken periods for this employee
        $takenPeriods = EmployeeDeduction::where('employee_id', $employeeId)
            ->get()
            ->map(fn ($d) => "{$d->pay_period_year}-{$d->pay_period_month}")
            ->toArray();

        return Inertia::render('employee-deductions/AddDeduction', [
            'employee' => $employee,
            'deductionTypes' => $deductionTypes,
            'takenPeriods' => $takenPeriods,
        ]);
    }

    public function edit(Request $request): Response
    {
        $employeeId = $request->input('employee_id');
        $month = $request->input('month');
        $year = $request->input('year');

        if (! $employeeId || ! $month || ! $year) {
            abort(404, 'Employee ID, month, and year are required');
        }

        $employee = Employee::with([
            'salaries' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            },
            'peras' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            },
            'ratas' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            },
        ])->findOrFail($employeeId);

        $deductionTypes = DeductionType::where('is_active', true)->orderBy('name')->get();

        // Get existing deductions for this period
        $existingDeductions = EmployeeDeduction::where('employee_id', $employeeId)
            ->where('pay_period_month', $month)
            ->where('pay_period_year', $year)
            ->with(['deductionType', 'salary'])
            ->get();

        // Get taken periods for this employee
        $takenPeriods = EmployeeDeduction::where('employee_id', $employeeId)
            ->get()
            ->map(fn ($d) => "{$d->pay_period_year}-{$d->pay_period_month}")
            ->toArray();

        return Inertia::render('employee-deductions/EditDeductions', [
            'employee' => $employee,
            'deductionTypes' => $deductionTypes,
            'existingDeductions' => $existingDeductions,
            'takenPeriods' => $takenPeriods,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'salary_id' => 'nullable|exists:salaries,id',
            'deduction_type_id' => 'required|exists:deduction_types,id',
            'amount' => 'required|numeric|min:0',
            'pay_period_month' => 'required|integer|min:1|max:12',
            'pay_period_year' => 'required|integer|min:2020|max:2100',
            'notes' => 'nullable|string',
        ]);

        $exists = EmployeeDeduction::where('employee_id', $validated['employee_id'])
            ->where('deduction_type_id', $validated['deduction_type_id'])
            ->where('pay_period_month', $validated['pay_period_month'])
            ->where('pay_period_year', $validated['pay_period_year'])
            ->exists();

        if ($exists) {
            return redirect()->back()->with('error', 'Deduction already exists for this employee and period');
        }

        EmployeeDeduction::create([
            'employee_id' => $validated['employee_id'],
            'salary_id' => $validated['salary_id'] ?? null,
            'deduction_type_id' => $validated['deduction_type_id'],
            'amount' => $validated['amount'],
            'pay_period_month' => $validated['pay_period_month'],
            'pay_period_year' => $validated['pay_period_year'],
            'notes' => $validated['notes'] ?? null,
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Deduction added successfully');
    }

    public function update(Request $request, EmployeeDeduction $employeeDeduction): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'pay_period_month' => 'nullable|integer|min:1|max:12',
            'pay_period_year' => 'nullable|integer|min:2020|max:2100',
        ]);

        // If a new pay period is provided and it differs from the current one,
        // attempt to move/merge the deduction to avoid creating duplicates.
        $newMonth = $validated['pay_period_month'] ?? $employeeDeduction->pay_period_month;
        $newYear = $validated['pay_period_year'] ?? $employeeDeduction->pay_period_year;

        if ($newMonth != $employeeDeduction->pay_period_month || $newYear != $employeeDeduction->pay_period_year) {
            $existing = EmployeeDeduction::where('employee_id', $employeeDeduction->employee_id)
                ->where('deduction_type_id', $employeeDeduction->deduction_type_id)
                ->where('pay_period_month', $newMonth)
                ->where('pay_period_year', $newYear)
                ->first();

            if ($existing) {
                // Merge: update target with incoming amount/notes and remove the old record
                $existing->amount = $validated['amount'];
                if (array_key_exists('notes', $validated)) {
                    $existing->notes = $validated['notes'];
                }
                $existing->save();

                if ($request->wantsJson()) {
                    return response()->json(['message' => 'Deduction moved and updated successfully']);
                }

                return redirect()->back()->with('success', 'Deduction moved and updated successfully');
            }

            // No conflict — update the current record's period and other fields
            $employeeDeduction->pay_period_month = $newMonth;
            $employeeDeduction->pay_period_year = $newYear;
            $employeeDeduction->amount = $validated['amount'];
            if (array_key_exists('notes', $validated)) {
                $employeeDeduction->notes = $validated['notes'];
            }
            $employeeDeduction->save();

            if ($request->wantsJson()) {
                return response()->json(['message' => 'Deduction moved and updated successfully']);
            }

            return redirect()->back()->with('success', 'Deduction moved and updated successfully');
        }

        $employeeDeduction->update($validated);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Deduction updated successfully']);
        }

        return redirect()->back()->with('success', 'Deduction updated successfully');
    }

    public function destroy(EmployeeDeduction $employeeDeduction): RedirectResponse
    {
        // Permission is checked via route middleware
        $employeeDeduction->delete();

        return redirect()->back()->with('success', 'Deduction deleted successfully');
    }
}
