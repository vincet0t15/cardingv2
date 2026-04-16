<?php

namespace App\Http\Controllers;

use App\Models\Adjustment;
use App\Models\Claim;
use App\Models\ClaimType;
use App\Models\DeductionType;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use App\Models\EmploymentStatus;
use App\Models\Office;
use App\Models\SourceOfFundCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ManageEmployeeController extends Controller
{
    public function index(Request $request, Employee $employee)
    {
        $this->authorize('view', $employee);

        $filterMonth = $request->input('deduction_month');
        $filterYear = $request->input('deduction_year');

        $employee->load([
            'office',
            'employmentStatus',
            'latestSalary',
            'earliestSalary',
            'latestPera',
            'latestRata',
            'latestHazardPay',
            'latestClothingAllowance',
            'salaries' => function ($query) {
                $query->orderBy('effective_date', 'desc')
                    ->with('sourceOfFundCode');
            },
            'peras' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            },
            'ratas' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            },
            'hazardPays' => function ($query) {
                $query->orderBy('start_date', 'desc')
                    ->with('sourceOfFundCode');
            },
            'clothingAllowances' => function ($query) {
                $query->orderBy('start_date', 'desc')
                    ->with('sourceOfFundCode');
            },
        ]);

        $periodsQuery = EmployeeDeduction::where('employee_id', $employee->id)
            ->selectRaw('pay_period_year, pay_period_month, COUNT(*) as deduction_count, SUM(amount) as total_amount')
            ->groupBy('pay_period_year', 'pay_period_month')
            ->orderBy('pay_period_year', 'desc')
            ->orderBy('pay_period_month', 'desc');

        if ($filterMonth) {
            $periodsQuery->where('pay_period_month', $filterMonth);
        }

        if ($filterYear) {
            $periodsQuery->where('pay_period_year', $filterYear);
        }

        $paginatedPeriods = $periodsQuery->paginate(50)->withQueryString();

        $periodsList = $paginatedPeriods->map(function ($p) {
            return "{$p->pay_period_year}-" . str_pad($p->pay_period_month, 2, '0', STR_PAD_LEFT);
        })->values()->toArray();

        // Build pair-safe period filters to avoid cross-joining years and months separately
        $periodPairs = $paginatedPeriods->map(function ($p) {
            return ['year' => $p->pay_period_year, 'month' => $p->pay_period_month];
        })->toArray();

        $deductionsQuery = EmployeeDeduction::where('employee_id', $employee->id);

        if (! empty($periodPairs)) {
            $deductionsQuery->where(function ($q) use ($periodPairs) {
                foreach ($periodPairs as $pair) {
                    $q->orWhere(function ($q2) use ($pair) {
                        $q2->where('pay_period_year', $pair['year'])
                            ->where('pay_period_month', $pair['month']);
                    });
                }
            });
        }

        $deductionsData = $deductionsQuery
            ->with('deductionType')
            ->orderBy('pay_period_year', 'desc')
            ->orderBy('pay_period_month', 'desc')
            ->get();

        $groupedDeductions = $deductionsData->groupBy(function ($d) {
            return "{$d->pay_period_year}-" . str_pad($d->pay_period_month, 2, '0', STR_PAD_LEFT);
        })->toArray();

        $takenPeriods = EmployeeDeduction::where('employee_id', $employee->id)
            ->selectRaw('DISTINCT pay_period_year, pay_period_month')
            ->get()
            ->map(function ($d) {
                return "{$d->pay_period_year}-" . str_pad($d->pay_period_month, 2, '0', STR_PAD_LEFT);
            })
            ->values()
            ->toArray();

        $availableYears = EmployeeDeduction::where('employee_id', $employee->id)
            ->selectRaw('DISTINCT pay_period_year as year')
            ->orderBy('pay_period_year', 'desc')
            ->pluck('year')
            ->toArray();

        $employmentStatuses = EmploymentStatus::all();
        $offices = Office::all();
        $deductionTypes = DeductionType::active()->get();
        $sourceOfFundCodes = SourceOfFundCode::where('status', true)->orderBy('code')->get();

        $claimMonth = $request->input('claim_month');
        $claimYear = $request->input('claim_year');
        $claimTypeId = $request->input('claim_type_id');

        $claimsQuery = Claim::where('employee_id', $employee->id)
            ->with('claimType')
            ->orderBy('claim_date', 'desc');

        if ($claimMonth) {
            $claimsQuery->whereMonth('claim_date', $claimMonth);
        }

        if ($claimYear) {
            $claimsQuery->whereYear('claim_date', $claimYear);
        }

        if ($claimTypeId) {
            $claimsQuery->where('claim_type_id', $claimTypeId);
        }

        $claims = $claimsQuery->paginate(20)->withQueryString();

        $claimTypes = ClaimType::active()->get();

        $availableClaimYears = Claim::where('employee_id', $employee->id)
            ->selectRaw('DISTINCT YEAR(claim_date) as year')
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->toArray();

        // All deductions & claims (unpaginated) for Overview + Reports
        $allDeductions = EmployeeDeduction::where('employee_id', $employee->id)
            ->with(['deductionType', 'salary'])
            ->orderBy('pay_period_year', 'desc')
            ->orderBy('pay_period_month', 'desc')
            ->get();

        $allClaims = Claim::where('employee_id', $employee->id)
            ->with('claimType')
            ->orderBy('claim_date', 'desc')
            ->get();

        $totalDeductionsAllTime = (float) $allDeductions->sum('amount');
        $totalClaimsAllTime = (float) $allClaims->sum('amount');

        // Load adjustments for this employee
        $adjustments = Adjustment::where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $adjustmentStatistics = [
            'total_pending' => Adjustment::where('employee_id', $employee->id)->pending()->count(),
            'total_approved' => Adjustment::where('employee_id', $employee->id)->approved()->count(),
            'total_processed' => Adjustment::where('employee_id', $employee->id)->processed()->count(),
            'total_rejected' => Adjustment::where('employee_id', $employee->id)->rejected()->count(),
            'total_amount' => Adjustment::where('employee_id', $employee->id)->sum('amount'),
        ];

        return Inertia::render('employees/Manage/Manage', [
            'employee' => $employee,
            // Explicitly include earliest_salary for the frontend props so components can
            // read employee.earliest_salary directly without relying on implicit
            // serializer behavior.
            'earliest_salary' => $employee->earliestSalary,
            'employmentStatuses' => $employmentStatuses,
            'offices' => $offices,
            'deductionTypes' => $deductionTypes,
            'sourceOfFundCodes' => $sourceOfFundCodes,
            'deductions' => $groupedDeductions,
            'periodsList' => $periodsList,
            'takenPeriods' => $takenPeriods,
            'availableYears' => $availableYears,
            'allEmployees' => Employee::with('office')
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'office_id']),
            'filters' => [
                'deduction_month' => $filterMonth,
                'deduction_year' => $filterYear,
            ],
            'deductionPagination' => [
                'current_page' => $paginatedPeriods->currentPage(),
                'last_page' => $paginatedPeriods->lastPage(),
                'per_page' => $paginatedPeriods->perPage(),
                'total' => $paginatedPeriods->total(),
            ],
            'claims' => $claims,
            'claimTypes' => $claimTypes,
            'availableClaimYears' => $availableClaimYears,
            'claimFilters' => [
                'claim_month' => $claimMonth,
                'claim_year' => $claimYear,
                'claim_type_id' => $claimTypeId,
            ],
            'allDeductions' => $allDeductions,
            'allClaims' => $allClaims,
            'totalDeductionsAllTime' => $totalDeductionsAllTime,
            'totalClaimsAllTime' => $totalClaimsAllTime,
            'adjustments' => $adjustments,
            'adjustmentStatistics' => $adjustmentStatistics,
            'similarEmployees' => session('similar_employees', []),
            'warning' => session('warning'),
            'editingEmployeeId' => session('editing_employee_id'),
        ]);
    }

    public function storeDeduction(Request $request, Employee $employee)
    {
        $this->authorize('update', $employee);
        $validated = $request->validate([
            'pay_period_month' => 'required|integer|min:1|max:12',
            'pay_period_year' => 'required|integer|min:2020|max:2100',
            'salary_id' => 'nullable|exists:salaries,id',
            'salary_amount' => 'nullable|numeric|min:0',
            'deductions' => 'required|array',
            'deductions.*.deduction_type_id' => 'required|exists:deduction_types,id',
            'deductions.*.amount' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $employee) {
            foreach ($validated['deductions'] as $deduction) {
                $amount = $deduction['amount'] ?? null;

                if ($amount === null || $amount === '') {
                    continue;
                }

                EmployeeDeduction::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'salary_id' => $validated['salary_id'] ?? null,
                        'deduction_type_id' => $deduction['deduction_type_id'],
                        'pay_period_month' => $validated['pay_period_month'],
                        'pay_period_year' => $validated['pay_period_year'],
                    ],
                    [
                        'amount' => $deduction['amount'],
                        'created_by' => Auth::id(),
                    ]
                );
            }
        });

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Deductions saved successfully']);
        }

        return redirect()->back()->with('success', 'Deductions saved successfully');
    }

    public function destroyDeduction(Employee $employee, EmployeeDeduction $deduction)
    {
        $this->authorize('update', $employee);

        $deduction->delete();

        return redirect()->back()->with('success', 'Deduction deleted successfully');
    }

    /**
     * Delete all deductions for a specific pay period for the given employee.
     * Expects `pay_period_month` and `pay_period_year` as request inputs.
     */
    public function destroyDeductionsForPeriod(Request $request, Employee $employee)
    {
        $this->authorize('update', $employee);

        $validated = $request->validate([
            'pay_period_month' => 'required|integer|min:1|max:12',
            'pay_period_year' => 'required|integer|min:2020|max:2100',
        ]);

        $deleted = EmployeeDeduction::where('employee_id', $employee->id)
            ->where('pay_period_month', $validated['pay_period_month'])
            ->where('pay_period_year', $validated['pay_period_year'])
            ->delete();

        return redirect()->back()->with('success', "Successfully deleted {$deleted} deduction(s) for the period");
    }

    public function print(Request $request, Employee $employee)
    {
        $this->authorize('view', $employee);
        $filterMonth = $request->input('month');
        $filterYear = $request->input('year');
        $printType = $request->input('type', 'all');

        // Re-fetch employee with all relationships to ensure proper serialization
        $employee = Employee::with([
            'office',
            'employmentStatus',
            'latestSalary',
            'latestPera',
            'latestRata',
            'latestHazardPay',
            'latestClothingAllowance',
            'salaries' => function ($query) {
                $query->orderBy('effective_date', 'desc');
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
        ])->findOrFail($employee->id);

        // Get all deductions
        $deductionsQuery = EmployeeDeduction::with('deductionType')
            ->where('employee_id', $employee->id);

        if ($filterMonth) {
            $deductionsQuery->where('pay_period_month', $filterMonth);
        }
        if ($filterYear) {
            $deductionsQuery->where('pay_period_year', $filterYear);
        }

        $allDeductions = $deductionsQuery->orderBy('pay_period_year', 'desc')
            ->orderBy('pay_period_month', 'desc')
            ->get();

        // Get all claims
        $claimsQuery = Claim::with('claimType')
            ->where('employee_id', $employee->id);

        if ($filterMonth) {
            $claimsQuery->whereMonth('claim_date', $filterMonth);
        }
        if ($filterYear) {
            $claimsQuery->whereYear('claim_date', $filterYear);
        }

        $allClaims = $claimsQuery->orderBy('claim_date', 'desc')->get();

        // Get all adjustments (approved and processed only for reports)
        $adjustmentsQuery = Adjustment::with(['adjustmentType', 'referenceType'])
            ->where('employee_id', $employee->id)
            ->whereIn('status', ['approved', 'processed']);

        if ($filterMonth) {
            $adjustmentsQuery->where('pay_period_month', $filterMonth);
        }
        if ($filterYear) {
            $adjustmentsQuery->where('pay_period_year', $filterYear);
        }

        $allAdjustments = $adjustmentsQuery->orderBy('created_at', 'desc')->get();

        return Inertia::render('employees/Manage/print', [
            'employee' => $employee,
            'allDeductions' => $allDeductions,
            'allClaims' => $allClaims,
            'allAdjustments' => $allAdjustments,
            'filterMonth' => $filterMonth,
            'filterYear' => $filterYear,
            'printType' => $printType,
        ]);
    }
}
