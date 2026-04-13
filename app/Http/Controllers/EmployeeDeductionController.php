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
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeeDeductionController extends Controller
{
    public function __construct(
        protected PayrollService $payrollService
    ) {}

    public function index(Request $request): Response
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        $officeId = $request->input('office_id');
        $employmentStatusId = $request->input('employment_status_id');
        $search = $request->input('search');
        $hasDeductions = $request->input('has_deductions', true); // Default to show only employees with deductions

        $employees = Employee::query()
            ->with(['employmentStatus', 'office'])
            // Only show employees who have deductions for the selected month/year
            ->when($hasDeductions, function ($query) use ($year, $month) {
                $query->whereHas('employeeDeductions', function ($q) use ($year, $month) {
                    $q->where('pay_period_year', $year)
                        ->where('pay_period_month', $month);
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
            ->with(['employeeDeductions' => function ($query) use ($year, $month) {
                $query->where('pay_period_year', $year)
                    ->where('pay_period_month', $month)
                    ->orderBy('created_at', 'desc');
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
    public function bulkAddPage(): Response
    {
        $employees = Employee::with('office')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'office_id', 'position']);

        $deductionTypes = DeductionType::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('EmployeeDeductions/BulkAdd', [
            'employees' => $employees,
            'deductionTypes' => $deductionTypes,
        ]);
    }

    /**
     * Show the create deduction page for a specific employee
     */
    public function create(Request $request): Response
    {
        $employeeId = $request->input('employee_id');

        if (!$employeeId) {
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
            ->map(fn($d) => "{$d->pay_period_year}-{$d->pay_period_month}")
            ->toArray();

        return Inertia::render('employee-deductions/AddDeduction', [
            'employee' => $employee,
            'deductionTypes' => $deductionTypes,
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
        ]);

        $employeeDeduction->update($validated);

        return redirect()->back()->with('success', 'Deduction updated successfully');
    }

    public function destroy(EmployeeDeduction $employeeDeduction): RedirectResponse
    {
        // Permission is checked via route middleware
        $employeeDeduction->delete();

        return redirect()->back()->with('success', 'Deduction deleted successfully');
    }

    /**
     * Bulk add deductions to multiple employees
     */
    public function bulkStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,id',
            'deduction_type_id' => 'required|exists:deduction_types,id',
            'amount' => 'required|numeric|min:0',
            'pay_period_month' => 'required|integer|min:1|max:12',
            'pay_period_year' => 'required|integer|min:2020|max:2100',
            'notes' => 'nullable|string',
        ]);

        $added = 0;
        $skipped = 0;
        $errors = [];

        foreach ($validated['employee_ids'] as $employeeId) {
            // Check if deduction already exists
            $exists = EmployeeDeduction::where('employee_id', $employeeId)
                ->where('deduction_type_id', $validated['deduction_type_id'])
                ->where('pay_period_month', $validated['pay_period_month'])
                ->where('pay_period_year', $validated['pay_period_year'])
                ->exists();

            if ($exists) {
                $skipped++;
                continue;
            }

            try {
                EmployeeDeduction::create([
                    'employee_id' => $employeeId,
                    'salary_id' => null,
                    'deduction_type_id' => $validated['deduction_type_id'],
                    'amount' => $validated['amount'],
                    'pay_period_month' => $validated['pay_period_month'],
                    'pay_period_year' => $validated['pay_period_year'],
                    'notes' => $validated['notes'] ?? null,
                    'created_by' => Auth::id(),
                ]);
                $added++;
            } catch (\Exception $e) {
                $errors[] = "Failed to add deduction for employee ID: {$employeeId}";
            }
        }

        $message = "Successfully added {$added} deduction(s).";
        if ($skipped > 0) {
            $message .= " Skipped {$skipped} duplicate(s).";
        }
        if (count($errors) > 0) {
            $message .= " " . count($errors) . " error(s) occurred.";
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Bulk update deductions
     */
    public function bulkUpdate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'deduction_ids' => 'required|array|min:1',
            'deduction_ids.*' => 'exists:employee_deductions,id',
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $updated = EmployeeDeduction::whereIn('id', $validated['deduction_ids'])
            ->update([
                'amount' => $validated['amount'],
                'notes' => $validated['notes'] ?? null,
            ]);

        return redirect()->back()->with('success', "Successfully updated {$updated} deduction(s).");
    }

    /**
     * Bulk delete deductions
     */
    public function bulkDestroy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'deduction_ids' => 'required|array|min:1',
            'deduction_ids.*' => 'exists:employee_deductions,id',
        ]);

        $deleted = EmployeeDeduction::whereIn('id', $validated['deduction_ids'])->delete();

        return redirect()->back()->with('success', "Successfully deleted {$deleted} deduction(s).");
    }
}
