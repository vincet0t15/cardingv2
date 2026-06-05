<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Services\EmployeeDashboardService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EmployeeDashboardController extends Controller
{
    public function __construct(
        private EmployeeDashboardService $dashboardService
    ) {}

    public function index(Request $request)
    {
        $user = Auth::user();

        $employee = Employee::where('user_id', $user->id)->first();

        if (! $employee) {
            return Inertia::render('EmployeeDashboard/Unlinked', [
                'message' => 'Your account is not linked to any employee record. Please contact your administrator.',
            ]);
        }

        $filterMonth = $request->input('month') ? (int) $request->input('month') : null;
        $filterYear = $request->input('year') ? (int) $request->input('year') : null;
        $page = (int) $request->input('page', 1);

        $data = $this->dashboardService->getDashboardData($employee, $filterMonth, $filterYear);

        // Group deductions by period for display
        $groupedDeductions = $data['deductions']->groupBy(function ($d) {
            return $d->pay_period_year . '-' . str_pad($d->pay_period_month, 2, '0', STR_PAD_LEFT);
        })->map(fn($group) => $group->map(fn($d) => [
            'id' => $d->id,
            'amount' => (float) $d->amount,
            'deduction_type' => $d->deductionType ? [
                'id' => $d->deductionType->id,
                'name' => $d->deductionType->name,
                'code' => $d->deductionType->contribution_code,
            ] : null,
        ])->toArray())->toArray();

        // Group claims by month
        $groupedClaims = $data['claims']->groupBy(function ($c) {
            return Carbon::parse($c->claim_date)->format('Y-m');
        })->map(fn($group) => $group->map(fn($c) => [
            'id' => $c->id,
            'amount' => (float) $c->amount,
            'claim_date' => $c->claim_date,
            'claim_type' => $c->claimType ? [
                'id' => $c->claimType->id,
                'code' => $c->claimType->code,
                'name' => $c->claimType->name,
            ] : null,
        ])->toArray())->toArray();

        // Group adjustments by period
        $groupedAdjustments = $data['adjustments']->groupBy(function ($a) {
            return $a->pay_period_year . '-' . str_pad($a->pay_period_month, 2, '0', STR_PAD_LEFT);
        })->map(fn($group) => $group->map(fn($a) => [
            'id' => $a->id,
            'amount' => (float) $a->amount,
            'adjustment_type' => $a->adjustmentType ? [
                'id' => $a->adjustmentType->id,
                'name' => $a->adjustmentType->name,
            ] : null,
            'reference_type' => $a->referenceType ? [
                'id' => $a->referenceType->id,
                'name' => $a->referenceType->name,
            ] : null,
            'status' => $a->status,
        ])->toArray())->toArray();

        // Paginate the payroll summaries
        $payrollPeriods = array_keys($data['payrollSummary']);
        $perPage = 5;
        $totalPages = max(1, (int) ceil(count($payrollPeriods) / $perPage));
        $currentPage = max(1, min($page, $totalPages));
        $offset = ($currentPage - 1) * $perPage;
        $paginatedPeriods = array_slice($payrollPeriods, $offset, $perPage);
        $paginatedPayroll = [];
        foreach ($paginatedPeriods as $period) {
            $paginatedPayroll[$period] = $data['payrollSummary'][$period];
        }

        return Inertia::render('EmployeeDashboard/Index', [
            'employee' => $data['employee'],
            'deductions' => $groupedDeductions,
            'claims' => $groupedClaims,
            'adjustments' => $groupedAdjustments,
            'payrollSummaries' => $paginatedPayroll,
            'totals' => $data['totals'],
            'availableYears' => $data['availableYears'],
            'filters' => [
                'month' => $filterMonth ? (string) $filterMonth : null,
                'year' => $filterYear ? (string) $filterYear : null,
            ],
            'pagination' => [
                'currentPage' => $currentPage,
                'totalPages' => $totalPages,
                'total' => count($payrollPeriods),
                'perPage' => $perPage,
            ],
        ]);
    }
}
