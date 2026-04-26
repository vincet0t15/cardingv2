<?php

namespace App\Http\Controllers;

use App\Models\Adjustment;
use App\Models\Employee;
use App\Http\Requests\AdjustmentStoreRequest;
use App\Http\Requests\AdjustmentUpdateRequest;
use App\Models\AdjustmentType;
use App\Models\ReferenceType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use App\Traits\HandlesDeletionRequests;

class AdjustmentController extends Controller
{
    use HandlesDeletionRequests;
    /**
     * Display a listing of adjustments.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Adjustment::class);

        $query = Adjustment::with(['employee.office', 'employee.employmentStatus', 'approvedBy', 'createdBy'])
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('adjustment_type', $request->type);
        }

        // Filter by employee
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by period
        if ($request->filled('month') && $request->filled('year')) {
            $query->where('pay_period_month', $request->month)
                ->where('pay_period_year', $request->year);
        }

        // Search by employee name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%");
            });
        }

        $adjustments = $query->paginate(20)->withQueryString();

        // Get statistics
        $statistics = [
            'total_pending' => Adjustment::pending()->count(),
            'total_approved' => Adjustment::approved()->count(),
            'total_processed' => Adjustment::processed()->count(),
            'total_amount_pending' => Adjustment::pending()->sum('amount'),
            'total_amount_approved' => Adjustment::approved()->sum('amount'),
            'total_amount_processed' => Adjustment::processed()->sum('amount'),
        ];

        return Inertia::render('adjustments/Index', [
            'adjustments' => $adjustments,
            'statistics' => $statistics,
            'employees' => Employee::with(['office'])->orderBy('last_name')->get(),
            'adjustmentTypes' => Adjustment::getAdjustmentTypes(),
            'filters' => $request->only(['status', 'type', 'employee_id', 'month', 'year', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new adjustment.
     */
    public function create(Request $request): Response
    {
        $this->authorize('create', Adjustment::class);

        $employees = Employee::with(['office', 'employmentStatus'])
            ->orderBy('last_name')
            ->get();

        // Load adjustment types and reference types from database
        $adjustmentTypes = \App\Models\AdjustmentType::orderBy('name')->get();
        $referenceTypes = \App\Models\ReferenceType::orderBy('name')->get();

        // Get pre-selected employee from URL parameter
        $preSelectedEmployeeId = $request->query('employee_id');

        return Inertia::render('adjustments/Create', [
            'employees' => $employees,
            'adjustmentTypes' => $adjustmentTypes,
            'referenceTypes' => $referenceTypes,
            'preSelectedEmployeeId' => $preSelectedEmployeeId,
        ]);
    }

    /**
     * Store a newly created adjustment in storage.
     */
    public function store(AdjustmentStoreRequest $request): RedirectResponse
    {
        $this->authorize('create', Adjustment::class);
        $adjustmentTypeName = null;
        if ($request->filled('adjustment_type_id')) {
            $adjustmentType = AdjustmentType::find($request->adjustment_type_id);
            $adjustmentTypeName = $adjustmentType?->name;
        }

        $referenceTypeName = null;
        if ($request->filled('reference_type_id')) {
            $referenceType = ReferenceType::find($request->reference_type_id);
            $referenceTypeName = $referenceType?->name;
        }

        $adjustment = Adjustment::create([
            'employee_id' => $request->employee_id,
            'adjustment_type_id' => $request->adjustment_type_id,
            'adjustment_type' => $adjustmentTypeName,
            'amount' => $request->amount,
            'pay_period_month' => $request->pay_period_month,
            'pay_period_year' => $request->pay_period_year,
            'effectivity_date' => $request->effectivity_date,
            'reference_id' => $request->reference_id,
            'reference_type_id' => $request->reference_type_id,
            'reference_type' => $referenceTypeName,
            'reason' => $request->reason,
            'remarks' => $request->remarks,
            'status' => Adjustment::STATUS_PENDING,
        ]);

        // Always redirect to the manage employee page after creating an adjustment
        $employeeId = $request->employee_id;

        return redirect()
            ->route('manage.employees.index', $employeeId)
            ->with('success', 'Adjustment created successfully and pending approval.');
    }

    /**
     * Display the specified adjustment.
     */
    public function show(Adjustment $adjustment): Response
    {
        $this->authorize('view', $adjustment);

        $adjustment->load(['employee.office', 'employee.employmentStatus', 'approvedBy', 'createdBy']);

        return Inertia::render('adjustments/Show', [
            'adjustment' => $adjustment,
        ]);
    }

    /**
     * Show the form for editing the specified adjustment.
     */
    public function edit(Adjustment $adjustment): Response
    {
        $this->authorize('update', $adjustment);

        $employees = Employee::with(['office', 'employmentStatus'])
            ->orderBy('last_name')
            ->get();

        return Inertia::render('adjustments/Edit', [
            'adjustment' => $adjustment,
            'employees' => $employees,
            'adjustmentTypes' => Adjustment::getAdjustmentTypes(),
        ]);
    }

    /**
     * Update the specified adjustment in storage.
     */
    public function update(AdjustmentUpdateRequest $request, Adjustment $adjustment): RedirectResponse
    {
        $this->authorize('update', $adjustment);

        // Only allow editing if status is pending
        if ($adjustment->status !== Adjustment::STATUS_PENDING) {
            return redirect()
                ->back()
                ->with('error', 'Cannot edit approved or processed adjustments.');
        }

        $adjustmentTypeName = null;
        if ($request->filled('adjustment_type_id')) {
            $adjustmentType = AdjustmentType::find($request->adjustment_type_id);
            $adjustmentTypeName = $adjustmentType?->name;
        }

        $referenceTypeName = null;
        if ($request->filled('reference_type_id')) {
            $referenceType = ReferenceType::find($request->reference_type_id);
            $referenceTypeName = $referenceType?->name;
        }

        $adjustment->update([
            'employee_id' => $request->employee_id,
            'adjustment_type_id' => $request->adjustment_type_id,
            'adjustment_type' => $adjustmentTypeName,
            'amount' => $request->amount,
            'pay_period_month' => $request->pay_period_month,
            'pay_period_year' => $request->pay_period_year,
            'effectivity_date' => $request->effectivity_date,
            'reference_id' => $request->reference_id,
            'reference_type_id' => $request->reference_type_id,
            'reference_type' => $referenceTypeName,
            'reason' => $request->reason,
            'remarks' => $request->remarks,
        ]);

        return redirect()
            ->route('adjustments.index')
            ->with('success', 'Adjustment updated successfully.');
    }

    /**
     * Approve the specified adjustment.
     */
    public function approve(Adjustment $adjustment): RedirectResponse
    {
        $this->authorize('approve', $adjustment);

        $adjustment->update([
            'status' => Adjustment::STATUS_APPROVED,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Adjustment approved successfully.');
    }

    /**
     * Reject the specified adjustment.
     */
    public function reject(Request $request, Adjustment $adjustment): RedirectResponse
    {
        $this->authorize('approve', $adjustment);

        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $adjustment->update([
            'status' => Adjustment::STATUS_REJECTED,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'remarks' => $adjustment->remarks . "\nRejection Reason: " . $request->rejection_reason,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Adjustment rejected.');
    }

    /**
     * Process the approved adjustment (apply to payroll).
     */
    public function process(Adjustment $adjustment): RedirectResponse
    {
        $this->authorize('process', $adjustment);

        if ($adjustment->status !== Adjustment::STATUS_APPROVED) {
            return redirect()
                ->back()
                ->with('error', 'Only approved adjustments can be processed.');
        }

        $adjustment->update([
            'status' => Adjustment::STATUS_PROCESSED,
            'processed_at' => now(),
            'processed_by' => Auth::user()->name,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Adjustment processed and applied to payroll.');
    }

    /**
     * Remove the specified adjustment from storage.
     */
    public function destroy(Adjustment $adjustment): RedirectResponse
    {
        // Only allow deletion if status is pending or rejected
        if (!in_array($adjustment->status, [Adjustment::STATUS_PENDING, Adjustment::STATUS_REJECTED])) {
            return redirect()
                ->back()
                ->with('error', 'Cannot delete approved or processed adjustments.');
        }

        return $this->handleDeletion($adjustment, 'adjustments.delete');
    }

    /**
     * Get adjustments for a specific employee (for employee management page).
     */
    public function employeeAdjustments(Employee $employee): Response
    {
        $this->authorize('viewAny', Adjustment::class);

        $adjustments = $employee->adjustments()
            ->with(['approvedBy', 'createdBy'])
            ->orderBy('pay_period_year', 'desc')
            ->orderBy('pay_period_month', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('adjustments/EmployeeAdjustments', [
            'employee' => $employee->load(['office', 'employmentStatus']),
            'adjustments' => $adjustments,
        ]);
    }

    /**
     * Generate adjustment report.
     */
    public function report(Request $request): Response
    {
        $this->authorize('viewAny', Adjustment::class);

        $query = Adjustment::with(['employee.office', 'approvedBy', 'createdBy'])
            ->orderBy('effectivity_date', 'desc');

        // Filter by period
        if ($request->filled('month') && $request->filled('year')) {
            $query->where('pay_period_month', $request->month)
                ->where('pay_period_year', $request->year);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('adjustment_type', $request->type);
        }

        $adjustments = $query->get();

        // Summary statistics
        $summary = [
            'total_adjustments' => $adjustments->count(),
            'total_amount' => $adjustments->sum('amount'),
            'by_type' => $adjustments->groupBy('adjustment_type')->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'total_amount' => $group->sum('amount'),
                ];
            }),
            'by_status' => $adjustments->groupBy('status')->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'total_amount' => $group->sum('amount'),
                ];
            }),
        ];

        return Inertia::render('adjustments/Report', [
            'adjustments' => $adjustments,
            'summary' => $summary,
            'filters' => $request->only(['month', 'year', 'status', 'type']),
            'adjustmentTypes' => Adjustment::getAdjustmentTypes(),
        ]);
    }
}
