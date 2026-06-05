<?php

namespace App\Services;

use App\Models\Adjustment;
use App\Models\Claim;
use App\Models\ClaimType;
use App\Models\ClothingAllowance;
use App\Models\DeductionType;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use App\Models\EmploymentStatus;
use App\Models\Office;
use App\Models\SourceOfFundCode;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class ManageEmployeeService
{
    /**
     * Load employee with all relationships needed across tabs.
     */
    public function loadEmployee(Employee $employee): Employee
    {
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
                $query->orderBy('effective_date', 'desc')->with('sourceOfFundCode');
            },
            'peras' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            },
            'ratas' => function ($query) {
                $query->orderBy('effective_date', 'desc');
            },
            'hazardPays' => function ($query) {
                $query->orderBy('start_date', 'desc')->with('sourceOfFundCode');
            },
            'clothingAllowances' => function ($query) {
                $query->orderBy('start_date', 'desc')->with('sourceOfFundCode');
            },
        ]);

        return $employee;
    }

    /**
     * Get static reference data shared across all tabs.
     */
    public function getReferenceData(): array
    {
        return [
            'deductionTypes' => DeductionType::active()->get(),
            'sourceOfFundCodes' => SourceOfFundCode::where('status', true)->orderBy('code')->get(),
            'employmentStatuses' => EmploymentStatus::all(),
            'offices' => Office::all(),
        ];
    }

    /**
     * Get claims and adjustments for an employee (used by overview, deductions, reports).
     */
    public function getClaimsAndAdjustments(Employee $employee): array
    {
        return [
            'allClaims' => Claim::where('employee_id', $employee->id)
                ->with('claimType')
                ->orderBy('claim_date', 'desc')
                ->get(),

            'adjustments' => Adjustment::with(['adjustmentType', 'referenceType'])
                ->where('employee_id', $employee->id)
                ->orderBy('created_at', 'desc')
                ->get(),
        ];
    }

    /**
     * Get deduction-related data: periods, grouped deductions, available years, etc.
     */
    public function getDeductionData(
        Employee $employee,
        ?int $filterMonth,
        ?int $filterYear,
        Collection $allClaims,
        Collection $adjustments
    ): array {
        $periodsArray = [];

        // 1. Periods from deductions
        $deductionPeriods = EmployeeDeduction::where('employee_id', $employee->id)
            ->select('pay_period_year', 'pay_period_month')
            ->distinct()
            ->get();

        foreach ($deductionPeriods as $d) {
            $periodsArray[] = $d->pay_period_year . '-' . str_pad((int) $d->pay_period_month, 2, '0', STR_PAD_LEFT);
        }

        // 2. Periods from claims
        foreach ($allClaims as $c) {
            if ($c->claim_date) {
                $periodsArray[] = Carbon::parse($c->claim_date)->format('Y-m');
            }
        }

        // 3. Periods from adjustments
        foreach ($adjustments as $a) {
            if ($a->pay_period_month && $a->pay_period_year) {
                $periodsArray[] = $a->pay_period_year . '-' . str_pad($a->pay_period_month, 2, '0', STR_PAD_LEFT);
            }
        }

        // 4. Periods from clothing allowances
        foreach ($employee->clothingAllowances as $ca) {
            if ($ca->start_date) {
                $periodsArray[] = Carbon::parse($ca->start_date)->format('Y-m');
            }
        }

        $periodsArray = array_unique($periodsArray);
        rsort($periodsArray);
        $allPeriods = collect($periodsArray);

        // Apply filters
        if ($filterMonth && $filterYear) {
            $filteredPeriod = $filterYear . '-' . str_pad($filterMonth, 2, '0', STR_PAD_LEFT);
            $allPeriods = collect(array_filter($periodsArray, fn($p) => $p === $filteredPeriod));
        } elseif ($filterYear) {
            $allPeriods = collect(array_filter($periodsArray, fn($p) => str_starts_with($p, (string) $filterYear)));
        } elseif ($filterMonth) {
            $suffix = '-' . str_pad($filterMonth, 2, '0', STR_PAD_LEFT);
            $allPeriods = collect(array_filter($periodsArray, fn($p) => str_ends_with($p, $suffix)));
        }

        // Build period list (paginated or flat depending on filter)
        $periodsList = $this->buildPeriodsList($allPeriods, $filterMonth, $filterYear);

        // Fetch deductions for selected periods
        $deductionsData = $this->fetchDeductionsForPeriods($employee, $periodsList);

        // Group deductions by period
        $groupedDeductions = $deductionsData->groupBy(function ($d) {
            return "{$d->pay_period_year}-" . str_pad($d->pay_period_month, 2, '0', STR_PAD_LEFT);
        })->map(fn($group) => $group->toArray())->toArray();

        // Taken periods (reuse already-fetched deduction periods)
        $takenPeriods = $deductionPeriods->map(function ($d) {
            return "{$d->pay_period_year}-" . str_pad((int) $d->pay_period_month, 2, '0', STR_PAD_LEFT);
        })->values()->toArray();

        // Available years
        $availableYears = $this->buildAvailableYears($employee, $allClaims, $adjustments);

        // All employees list (for deduction assignment)
        $allEmployees = Employee::with('office')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'office_id']);

        // Grouped claims by period
        $allClaimsGrouped = $allClaims->groupBy(function ($c) {
            return Carbon::parse($c->claim_date)->format('Y-m');
        })->map(fn($group) => $group->toArray())->toArray();

        // Grouped adjustments by period
        $allAdjustmentsGrouped = $adjustments
            ->filter(fn($adj) => $adj->status !== 'rejected' && $adj->pay_period_month && $adj->pay_period_year)
            ->groupBy(function ($adj) {
                return "{$adj->pay_period_year}-" . str_pad($adj->pay_period_month, 2, '0', STR_PAD_LEFT);
            })
            ->map(fn($group) => $group->toArray())
            ->toArray();

        return [
            'deductionPeriods' => $deductionPeriods,
            'groupedDeductions' => $groupedDeductions,
            'deductionsData' => $deductionsData,
            'periodsList' => $periodsList,
            'takenPeriods' => $takenPeriods,
            'availableYears' => $availableYears,
            'allEmployees' => $allEmployees,
            'allClaimsGrouped' => $allClaimsGrouped,
            'allAdjustmentsGrouped' => $allAdjustmentsGrouped,
            'allPeriodsCount' => $allPeriods->count(),
        ];
    }

    /**
     * Get overview/summary data (all-time totals, clothing allowances).
     */
    public function getOverviewData(
        Employee $employee,
        Collection $deductionsData,
        Collection $allClaims
    ): array {
        $allClothingAllowances = $employee->clothingAllowances()
            ->with('sourceOfFundCode')
            ->orderBy('start_date', 'desc')
            ->get();

        return [
            'allDeductions' => $deductionsData, // raw collection (frontend expects EmployeeDeduction[])
            'totalDeductionsAllTime' => (float) $deductionsData->sum('amount'),
            'totalClaimsAllTime' => (float) $allClaims->sum('amount'),
            'allClothingAllowances' => $allClothingAllowances,
        ];
    }

    /**
     * Get paginated claims for the claims tab.
     */
    public function getClaimsData(Employee $employee, Request $request): array
    {
        $claimMonth = $request->input('claim_month');
        $claimYear = $request->input('claim_year');
        $claimTypeId = $request->input('claim_type_id');

        $query = Claim::where('employee_id', $employee->id)
            ->with('claimType')
            ->orderBy('claim_date', 'desc');

        if ($claimMonth) {
            $query->whereMonth('claim_date', $claimMonth);
        }
        if ($claimYear) {
            $query->whereYear('claim_date', $claimYear);
        }
        if ($claimTypeId) {
            $query->where('claim_type_id', $claimTypeId);
        }

        return [
            'claims' => $query->paginate(20)->withQueryString(),
            'claimTypes' => ClaimType::active()->get(),
            'availableClaimYears' => Claim::where('employee_id', $employee->id)
                ->selectRaw('DISTINCT YEAR(claim_date) as year')
                ->orderBy('year', 'desc')
                ->pluck('year')
                ->toArray(),
            'claimFilters' => [
                'claim_month' => $claimMonth,
                'claim_year' => $claimYear,
                'claim_type_id' => $claimTypeId,
            ],
        ];
    }

    /**
     * Get adjustment statistics (used by overview + adjustments tab).
     */
    public function getAdjustmentStats(Employee $employee): array
    {
        return [
            'total_processed' => Adjustment::where('employee_id', $employee->id)->processed()->count(),
            'total_amount' => Adjustment::where('employee_id', $employee->id)->sum('amount'),
        ];
    }

    // ─── Private helpers ─────────────────────────────────────────────

    private function buildPeriodsList(Collection $allPeriods, ?int $filterMonth, ?int $filterYear): array
    {
        if ($filterMonth && !$filterYear) {
            return array_values($allPeriods->toArray());
        }

        return array_values($allPeriods->forPage(1, 50)->toArray());
    }

    private function fetchDeductionsForPeriods(Employee $employee, array $periodsList): Collection
    {
        if (empty($periodsList)) {
            return collect();
        }

        $periodPairs = array_map(function ($periodKey) {
            [$year, $month] = explode('-', $periodKey);
            return ['year' => (int) $year, 'month' => (int) ltrim($month, '0') ?: (int) $month];
        }, $periodsList);

        $query = EmployeeDeduction::where('employee_id', $employee->id);

        $query->where(function ($q) use ($periodPairs) {
            foreach ($periodPairs as $pair) {
                $q->orWhere(function ($q2) use ($pair) {
                    $q2->where('pay_period_year', $pair['year'])
                        ->where('pay_period_month', $pair['month']);
                });
            }
        });

        return $query->with('deductionType')
            ->with('salary')
            ->orderBy('pay_period_year', 'desc')
            ->orderBy('pay_period_month', 'desc')
            ->get();
    }

    private function buildAvailableYears(
        Employee $employee,
        Collection $allClaims,
        Collection $adjustments
    ): array {
        $currentYear = Carbon::now()->year;
        $startYear = $currentYear - 10;
        $endYear = $currentYear + 5;
        $yearRange = range($startYear, $endYear);

        $dataYears = collect()
            ->merge(EmployeeDeduction::where('employee_id', $employee->id)
                ->select('pay_period_year as year')->distinct())
            ->merge($allClaims->map(fn($c) => (object) [
                'year' => (int) Carbon::parse($c->claim_date)->format('Y'),
            ])->unique('year')->values())
            ->merge($adjustments->filter(fn($a) => $a->pay_period_year)
                ->map(fn($a) => (object) ['year' => $a->pay_period_year]))
            ->merge($employee->clothingAllowances->map(fn($ca) => (object) [
                'year' => (int) Carbon::parse($ca->start_date)->format('Y'),
            ]))
            ->pluck('year')
            ->unique()
            ->toArray();

        return collect($yearRange)
            ->merge($dataYears)
            ->unique()
            ->sort()
            ->reverse()
            ->values()
            ->toArray();
    }
}
