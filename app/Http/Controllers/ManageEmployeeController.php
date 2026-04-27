<?php

namespace App\Http\Controllers;

use App\Models\Adjustment;
use App\Models\Claim;
use App\Models\ClaimType;
use App\Models\ClothingAllowance;
use App\Models\DeleteRequest;
use App\Models\DeductionType;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use App\Models\EmploymentStatus;
use App\Models\Notification;
use App\Models\Office;
use App\Models\SourceOfFundCode;
use App\Traits\HandlesDeletionRequests;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ManageEmployeeController extends Controller
{
    use HandlesDeletionRequests;
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

        // Fetch all data first before calculating periods
        $allClaims = Claim::where('employee_id', $employee->id)
            ->with('claimType')
            ->orderBy('claim_date', 'desc')
            ->get();

        $adjustments = Adjustment::with(['adjustmentType', 'referenceType'])
            ->where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Get ALL periods from all sources (deductions, claims, adjustments, clothing allowances)
        $periodsArray = [];

        // Deductions periods
        $deductionPeriods = EmployeeDeduction::where('employee_id', $employee->id)
            ->select('pay_period_year', 'pay_period_month')
            ->distinct()
            ->get();
        foreach ($deductionPeriods as $d) {
            $periodsArray[] = $d->pay_period_year . '-' . str_pad($d->pay_period_month, 2, '0', STR_PAD_LEFT);
        }

        // Claims periods
        foreach ($allClaims as $c) {
            if ($c->claim_date) {
                $periodsArray[] = \Carbon\Carbon::parse($c->claim_date)->format('Y-m');
            }
        }

        // Adjustments periods (with pay_period_month/year)
        foreach ($adjustments as $a) {
            if ($a->pay_period_month && $a->pay_period_year) {
                $periodsArray[] = $a->pay_period_year . '-' . str_pad($a->pay_period_month, 2, '0', STR_PAD_LEFT);
            }
        }

        // Clothing allowance periods
        foreach ($employee->clothingAllowances as $ca) {
            if ($ca->start_date) {
                $periodsArray[] = \Carbon\Carbon::parse($ca->start_date)->format('Y-m');
            }
        }

        // Remove duplicates and sort by date (newest first)
        $periodsArray = array_unique($periodsArray);
        rsort($periodsArray);
        $allPeriods = collect($periodsArray);

        // Apply filter if month/year selected
        if ($filterMonth && $filterYear) {
            $filteredPeriod = $filterYear . '-' . str_pad($filterMonth, 2, '0', STR_PAD_LEFT);
            $filteredArr = array_filter($periodsArray, fn($p) => $p === $filteredPeriod);
            $allPeriods = collect($filteredArr);
        } elseif ($filterYear) {
            $filteredArr = array_filter($periodsArray, fn($p) => str_starts_with($p, (string) $filterYear));
            $allPeriods = collect($filteredArr);
        } elseif ($filterMonth) {
            $suffix = '-' . str_pad($filterMonth, 2, '0', STR_PAD_LEFT);
            $filteredArr = array_filter($periodsArray, fn($p) => str_ends_with($p, $suffix));
            $allPeriods = collect($filteredArr);
        }

        // Paginate the allPeriods
        $allPeriodsPaginated = $allPeriods->forPage(1, 50);
        $periodsList = $allPeriodsPaginated->toArray();

        // Get period pairs for filtering deductions
        $periodPairs = array_map(function ($periodKey) {
            [$year, $month] = explode('-', $periodKey);
            return ['year' => (int) $year, 'month' => (int) ltrim($month, '0') ?: (int) $month];
        }, $periodsList);

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
        })->map(function ($group) {
            return $group->toArray();
        })->toArray();

        $takenPeriods = EmployeeDeduction::where('employee_id', $employee->id)
            ->selectRaw('DISTINCT pay_period_year, pay_period_month')
            ->get()
            ->map(function ($d) {
                return "{$d->pay_period_year}-" . str_pad($d->pay_period_month, 2, '0', STR_PAD_LEFT);
            })
            ->values()
            ->toArray();

        $availableYears = collect()
            ->merge(EmployeeDeduction::where('employee_id', $employee->id)->select('pay_period_year as year')->distinct())
            ->merge($allClaims->map(fn($c) => (object) ['year' => (int) \Carbon\Carbon::parse($c->claim_date)->format('Y')])->unique('year'))
            ->merge($adjustments->filter(fn($a) => $a->pay_period_year)->map(fn($a) => (object) ['year' => $a->pay_period_year]))
            ->merge($employee->clothingAllowances->map(fn($ca) => (object) ['year' => (int) \Carbon\Carbon::parse($ca->start_date)->format('Y')]))
            ->pluck('year')
            ->unique()
            ->sort()
            ->reverse()
            ->values()
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

        // All deductions & claims (unpaginated) for Overview + Reports + Edit Dialog
        $allDeductionsData = EmployeeDeduction::where('employee_id', $employee->id)
            ->with(['deductionType', 'salary'])
            ->orderBy('pay_period_year', 'desc')
            ->orderBy('pay_period_month', 'desc')
            ->get();

        $allDeductions = $allDeductionsData->groupBy(function ($d) {
            return "{$d->pay_period_year}-" . str_pad($d->pay_period_month, 2, '0', STR_PAD_LEFT);
        })->map(function ($group) {
            return $group->toArray();
        })->toArray();

        $allClothingAllowances = $employee->clothingAllowances()
            ->with('sourceOfFundCode')
            ->orderBy('start_date', 'desc')
            ->get();

        $allClaimsGrouped = $allClaims->groupBy(function ($c) {
            return \Carbon\Carbon::parse($c->claim_date)->format('Y-m');
        })->map(function ($group) {
            return $group->toArray();
        })->toArray();

        $totalDeductionsAllTime = (float) $allDeductionsData->sum('amount');
        $totalClaimsAllTime = (float) $allClaims->sum('amount');

        $allAdjustmentsGrouped = $adjustments->filter(function ($adj) {
            return $adj->status !== 'rejected' && $adj->pay_period_month && $adj->pay_period_year;
        })->groupBy(function ($adj) {
            return "{$adj->pay_period_year}-" . str_pad($adj->pay_period_month, 2, '0', STR_PAD_LEFT);
        })->map(function ($group) {
            return $group->toArray();
        })->toArray();

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
                'current_page' => 1,
                'last_page' => ceil($allPeriods->count() / 50),
                'per_page' => 50,
                'total' => $allPeriods->count(),
            ],
            'claims' => $claims,
            'claimTypes' => $claimTypes,
            'availableClaimYears' => $availableClaimYears,
            'claimFilters' => [
                'claim_month' => $claimMonth,
                'claim_year' => $claimYear,
                'claim_type_id' => $claimTypeId,
            ],
            'allDeductions' => $allDeductionsData,
            'allClaims' => $allClaims,
            'allClaimsGrouped' => $allClaimsGrouped,
            'allClothingAllowances' => $allClothingAllowances,
            'totalDeductionsAllTime' => $totalDeductionsAllTime,
            'totalClaimsAllTime' => $totalClaimsAllTime,
            'adjustments' => $adjustments,
            'allAdjustmentsGrouped' => $allAdjustmentsGrouped,
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
        $this->authorize('delete', $deduction);

        $user = Auth::user();

        // Check if user has direct permission to delete
        if ($user->hasPermissionTo('deductions.delete')) {
            $deduction->delete();
            return back()->with('success', 'Deduction deleted successfully');
        }

        // User doesn't have permission - create delete request
        $reason = request()->input('reason', 'No reason provided');

        $deleteRequest = DeleteRequest::create([
            'requestable_type' => EmployeeDeduction::class,
            'requestable_id' => $deduction->id,
            'requested_by' => $user->id,
            'status' => DeleteRequest::STATUS_PENDING,
            'reason' => $reason,
        ]);

        // Notify super admins
        $this->notifySuperAdminsOfDeletionRequest($deleteRequest, $deduction, $user);

        return back()->with('success', 'Deduction deletion request sent to super admin for approval');
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

        // Create date range for the period
        $startOfMonth = Carbon::createFromDate($validated['pay_period_year'], $validated['pay_period_month'], 1)->startOfMonth();
        $endOfMonth = Carbon::createFromDate($validated['pay_period_year'], $validated['pay_period_month'], 1)->endOfMonth();

        // Find deductions and adjustments to delete
        $deductions = EmployeeDeduction::where('employee_id', $employee->id)
            ->where('pay_period_month', $validated['pay_period_month'])
            ->where('pay_period_year', $validated['pay_period_year'])
            ->get();

        $adjustments = Adjustment::where('employee_id', $employee->id)
            ->where('pay_period_month', $validated['pay_period_month'])
            ->where('pay_period_year', $validated['pay_period_year'])
            ->get();

        // Find clothing allowances within this period
        $clothingAllowances = ClothingAllowance::where('employee_id', $employee->id)
            ->whereBetween('start_date', [$startOfMonth, $endOfMonth])
            ->get();

        $totalItems = $deductions->count() + $adjustments->count() + $clothingAllowances->count();

        if ($totalItems === 0) {
            return back()->with('error', 'No items found for this period');
        }

        $user = Auth::user();

        // Check if user has direct permission to delete
        if ($user->hasPermissionTo('deductions.delete')) {
            // Delete all deductions for this period
            EmployeeDeduction::where('employee_id', $employee->id)
                ->where('pay_period_month', $validated['pay_period_month'])
                ->where('pay_period_year', $validated['pay_period_year'])
                ->delete();

            // Delete all adjustments for this period
            Adjustment::where('employee_id', $employee->id)
                ->where('pay_period_month', $validated['pay_period_month'])
                ->where('pay_period_year', $validated['pay_period_year'])
                ->delete();

            // Delete clothing allowances within this period
            ClothingAllowance::where('employee_id', $employee->id)
                ->whereBetween('start_date', [$startOfMonth, $endOfMonth])
                ->delete();

            $deductionCount = $deductions->count();
            $adjustmentCount = $adjustments->count();
            $clothingCount = $clothingAllowances->count();

            $message = "Successfully deleted entire period";
            if ($deductionCount > 0 && $adjustmentCount > 0 && $clothingCount > 0) {
                $message = "Successfully deleted {$deductionCount} deduction(s), {$adjustmentCount} adjustment(s), and {$clothingCount} clothing allowance(s)";
            } elseif ($deductionCount > 0 && $adjustmentCount > 0) {
                $message = "Successfully deleted {$deductionCount} deduction(s) and {$adjustmentCount} adjustment(s)";
            } elseif ($deductionCount > 0 && $clothingCount > 0) {
                $message = "Successfully deleted {$deductionCount} deduction(s) and {$clothingCount} clothing allowance(s)";
            } elseif ($adjustmentCount > 0 && $clothingCount > 0) {
                $message = "Successfully deleted {$adjustmentCount} adjustment(s) and {$clothingCount} clothing allowance(s)";
            } elseif ($deductionCount > 0) {
                $message = "Successfully deleted {$deductionCount} deduction(s)";
            } elseif ($adjustmentCount > 0) {
                $message = "Successfully deleted {$adjustmentCount} adjustment(s)";
            } elseif ($clothingCount > 0) {
                $message = "Successfully deleted {$clothingCount} clothing allowance(s)";
            }

            return back()->with('success', $message);
        }

        // User doesn't have permission - create delete request for bulk deletion
        $firstItem = $deductions->first() ?? $adjustments->first() ?? $clothingAllowances->first();
        $this->notifySuperAdminsOfDeletionRequest($deleteRequest, $firstItem, $user);

        return back()->with('success', "Deletion request for period {$validated['pay_period_month']}/{$validated['pay_period_year']} sent to super admin for approval");
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

        // Get all adjustments (exclude rejected only) so pending adjustments also appear in reports/print
        $adjustmentsQuery = Adjustment::with(['adjustmentType', 'referenceType'])
            ->where('employee_id', $employee->id)
            ->where('status', '!=', 'rejected');

        if ($filterMonth) {
            $adjustmentsQuery->where('pay_period_month', $filterMonth);
        }
        if ($filterYear) {
            $adjustmentsQuery->where('pay_period_year', $filterYear);
        }

        $allAdjustments = $adjustmentsQuery->orderBy('created_at', 'desc')->get();

        // Get clothing allowances for the period
        $clothingAllowancesQuery = $employee->clothingAllowances();

        if ($filterMonth && $filterYear) {
            $periodStart = now()->setDate($filterYear, $filterMonth, 1)->startOfMonth();
            $periodEnd = now()->setDate($filterYear, $filterMonth, 1)->endOfMonth();
            $clothingAllowancesQuery->where('start_date', '<=', $periodEnd)
                ->where(function ($q) use ($periodStart) {
                    $q->whereNull('end_date')
                        ->orWhere('end_date', '>=', $periodStart);
                });
        }

        $allClothingAllowances = $clothingAllowancesQuery->orderBy('start_date', 'desc')->get();

        return Inertia::render('employees/Manage/print', [
            'employee' => $employee,
            'allDeductions' => $allDeductions,
            'allClaims' => $allClaims,
            'allAdjustments' => $allAdjustments,
            'allClothingAllowances' => $allClothingAllowances,
            'filterMonth' => $filterMonth,
            'filterYear' => $filterYear,
            'printType' => $printType,
        ]);
    }
}
