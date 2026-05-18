<?php

namespace App\Http\Controllers;

use App\Models\Adjustment;
use App\Models\Claim;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EmployeeDashboardController extends Controller
{
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
        $page = $request->input('page', 1);

        $employee->load([
            'office',
            'employmentStatus',
            'latestSalary',
            'latestPera',
            'latestRata',
            'latestHazardPay',
            'latestClothingAllowance',
            'salaries' => function ($query) {
                $query->orderBy('effective_date', 'desc')->with('sourceOfFundCode');
            },
            'peras' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            },
            'ratas' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            },
            'hazardPays' => function ($query) {
                $query->orderBy('start_date', 'desc');
            },
            'clothingAllowances' => function ($query) {
                $query->orderBy('start_date', 'desc');
            },
        ]);

        // Deductions - Get ALL data first for year dropdown
        $allDeductions = EmployeeDeduction::where('employee_id', $employee->id)
            ->with('deductionType')
            ->get();

        // Now apply filters for display
        $deductionsQuery = EmployeeDeduction::where('employee_id', $employee->id)
            ->with('deductionType');

        if ($filterMonth) {
            $deductionsQuery->where('pay_period_month', $filterMonth);
        }
        if ($filterYear) {
            $deductionsQuery->where('pay_period_year', $filterYear);
        }

        $deductions = $deductionsQuery->orderBy('pay_period_year', 'desc')
            ->orderBy('pay_period_month', 'desc')
            ->limit(200)
            ->get();

        $groupedDeductions = $deductions->groupBy(function ($d) {
            return $d->pay_period_year . '-' . str_pad($d->pay_period_month, 2, '0', STR_PAD_LEFT);
        })->map(function ($group) {
            return $group->map(function ($d) {
                return [
                    'id' => $d->id,
                    'amount' => (float) $d->amount,
                    'deduction_type' => $d->deductionType ? [
                        'id' => $d->deductionType->id,
                        'name' => $d->deductionType->name,
                    ] : null,
                ];
            })->toArray();
        })->toArray();

        $totalDeductions = collect($groupedDeductions)->flatten(1)->sum('amount');

        // Paginate deductions
        $deductionsPaginatedArray = array_values($groupedDeductions);
        $deductionsPerPage = 3;
        $deductionsTotal = count($deductionsPaginatedArray);
        $deductionsPages = ceil($deductionsTotal / $deductionsPerPage);
        $deductionsCurrent = max(1, min($page, $deductionsPages));
        $deductionsOffset = ($deductionsCurrent - 1) * $deductionsPerPage;
        $deductionsPaginated = array_slice($deductionsPaginatedArray, $deductionsOffset, $deductionsPerPage);
        $groupedDeductions = array_combine(
            array_slice(array_keys($groupedDeductions), $deductionsOffset, $deductionsPerPage),
            $deductionsPaginated
        ) ?: [];

        // Claims - Get ALL data first for year dropdown
        $allClaims = Claim::where('employee_id', $employee->id)
            ->with('claimType')
            ->get();

        // Now apply filters for display
        $claimsQuery = Claim::where('employee_id', $employee->id)
            ->with('claimType');

        if ($filterMonth) {
            $claimsQuery->whereMonth('claim_date', $filterMonth);
        }
        if ($filterYear) {
            $claimsQuery->whereYear('claim_date', $filterYear);
        }

        $claims = $claimsQuery->orderBy('claim_date', 'desc')
            ->limit(200)
            ->get();

        $groupedClaims = $claims->groupBy(function ($c) {
            return Carbon::parse($c->claim_date)->format('Y-m');
        })->map(function ($group) {
            return $group->map(function ($c) {
                return [
                    'id' => $c->id,
                    'amount' => (float) $c->amount,
                    'claim_date' => $c->claim_date,
                    'claim_type' => $c->claimType ? [
                        'id' => $c->claimType->id,
                        'code' => $c->claimType->code,
                        'name' => $c->claimType->name,
                    ] : null,
                ];
            })->toArray();
        })->toArray();

        $totalClaims = collect($groupedClaims)->flatten(1)->sum('amount');

        // Paginate claims
        $claimsPaginatedArray = array_values($groupedClaims);
        $claimsPerPage = 3;
        $claimsTotal = count($claimsPaginatedArray);
        $claimsPages = ceil($claimsTotal / $claimsPerPage);
        $claimsCurrent = max(1, min($page, $claimsPages));
        $claimsOffset = ($claimsCurrent - 1) * $claimsPerPage;
        $claimsPaginated = array_slice($claimsPaginatedArray, $claimsOffset, $claimsPerPage);
        $groupedClaims = array_combine(
            array_slice(array_keys($groupedClaims), $claimsOffset, $claimsPerPage),
            $claimsPaginated
        ) ?: [];

        // Adjustments - Get ALL data first for year dropdown
        $allAdjustments = Adjustment::where('employee_id', $employee->id)
            ->with(['adjustmentType', 'referenceType'])
            ->get();

        // Now apply filters for display
        $adjustmentsQuery = Adjustment::where('employee_id', $employee->id)
            ->with(['adjustmentType', 'referenceType']);

        if ($filterMonth) {
            $adjustmentsQuery->where('pay_period_month', $filterMonth);
        }
        if ($filterYear) {
            $adjustmentsQuery->where('pay_period_year', $filterYear);
        }

        $adjustments = $adjustmentsQuery->orderBy('created_at', 'desc')
            ->limit(200)
            ->get();

        $groupedAdjustments = $adjustments->groupBy(function ($a) {
            return $a->pay_period_year . '-' . str_pad($a->pay_period_month, 2, '0', STR_PAD_LEFT);
        })->map(function ($group) {
            return $group->map(function ($a) {
                return [
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
                ];
            })->toArray();
        })->toArray();

        $totalAdjustments = collect($groupedAdjustments)->flatten(1)->sum('amount');

        // Paginate adjustments
        $adjustmentsPaginatedArray = array_values($groupedAdjustments);
        $adjustmentsPerPage = 3;
        $adjustmentsTotal = count($adjustmentsPaginatedArray);
        $adjustmentsPages = ceil($adjustmentsTotal / $adjustmentsPerPage);
        $adjustmentsCurrent = max(1, min($page, $adjustmentsPages));
        $adjustmentsOffset = ($adjustmentsCurrent - 1) * $adjustmentsPerPage;
        $adjustmentsPaginated = array_slice($adjustmentsPaginatedArray, $adjustmentsOffset, $adjustmentsPerPage);
        $groupedAdjustments = array_combine(
            array_slice(array_keys($groupedAdjustments), $adjustmentsOffset, $adjustmentsPerPage),
            $adjustmentsPaginated
        ) ?: [];

        // Available years - from ALL data, not filtered data
        $allDeductionsForYears = EmployeeDeduction::where('employee_id', $employee->id)->select('pay_period_year')->distinct()->pluck('pay_period_year');
        $allClaimsForYears = Claim::where('employee_id', $employee->id)->get()->map(fn($c) => Carbon::parse($c->claim_date)->year)->unique();
        $allAdjustmentsForYears = Adjustment::where('employee_id', $employee->id)->select('pay_period_year')->distinct()->pluck('pay_period_year');

        $availableYears = collect()
            ->merge($allDeductionsForYears)
            ->merge($allClaimsForYears)
            ->merge($allAdjustmentsForYears)
            ->filter()
            ->sort()
            ->reverse()
            ->values()
            ->toArray();

        return Inertia::render('EmployeeDashboard/Index', [
            'employee' => $employee,
            'deductions' => $groupedDeductions,
            'claims' => $groupedClaims,
            'adjustments' => $groupedAdjustments,
            'totalDeductions' => $totalDeductions,
            'totalClaims' => $totalClaims,
            'totalAdjustments' => $totalAdjustments,
            'availableYears' => $availableYears,
            'filters' => [
                'month' => $filterMonth ? (string) $filterMonth : null,
                'year' => $filterYear ? (string) $filterYear : null,
            ],
            'pagination' => [
                'deductions' => [
                    'currentPage' => $deductionsCurrent,
                    'totalPages' => $deductionsPages,
                    'total' => $deductionsTotal,
                ],
                'claims' => [
                    'currentPage' => $claimsCurrent,
                    'totalPages' => $claimsPages,
                    'total' => $claimsTotal,
                ],
                'adjustments' => [
                    'currentPage' => $adjustmentsCurrent,
                    'totalPages' => $adjustmentsPages,
                    'total' => $adjustmentsTotal,
                ],
            ],
            'userRoles' => $user->getRoleNames()->toArray(),
        ]);
    }
}
