<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\DeductionType;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use App\Models\EmploymentStatus;
use App\Models\GeneralFund;
use App\Models\Office;
use App\Models\Pera;
use App\Models\Rata;
use App\Models\Salary;
use App\Models\SourceOfFundCode;
use App\Models\Supplier;
use App\Models\SupplierTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if ($user) {
            // If user should be on the employee portal, redirect them
            if ($user->shouldUseEmployeePortal()) {
                return redirect()->route('employee.dashboard');
            }

            // If user is not linked to an employee AND not an admin → redirect to employees list
            if (! $user->isEmployee() && ! $user->isAdmin()) {
                return redirect()->route('employees.index');
            }
        }

        // Get month and year from request, default to current
        // If empty, fetch all data
        $month = $request->input('month');
        $year = $request->input('year');

        // Use defaults only if both are provided
        $useFilters = ! empty($month) && ! empty($year);

        if (! $useFilters) {
            $month = now()->month;
            $year = now()->year;
        }

        $totalEmployees = Employee::count();
        $totalOffices = Office::count();
        $totalDeductionTypes = DeductionType::where('is_active', true)->count();

        // Calculate trends
        $lastMonth = now()->subMonth();
        $employeesLastMonth = Employee::whereMonth('created_at', $lastMonth->month)
            ->whereYear('created_at', $lastMonth->year)
            ->count();

        $employeeGrowth = $totalEmployees > 0 && $employeesLastMonth > 0
            ? round((($totalEmployees - $employeesLastMonth) / $employeesLastMonth) * 100, 1)
            : 0;

        // New offices this year
        $officesThisYear = Office::whereYear('created_at', now()->year)->count();

        // New claims this week
        $claimsThisWeek = Claim::where('created_at', '>=', now()->subWeek())->count();

        // Current month stats
        $currentMonth = $month;
        $currentYear = $year;

        // Total deductions this month (or all if no filter)
        $monthlyDeductionsQuery = EmployeeDeduction::query();
        if ($useFilters) {
            $monthlyDeductionsQuery->where('pay_period_month', $currentMonth)
                ->where('pay_period_year', $currentYear);
        }
        $monthlyDeductionsCount = $monthlyDeductionsQuery->count();

        $monthlyDeductionsTotal = $monthlyDeductionsQuery->sum('amount');

        // Employees with deductions this month (or all if no filter)
        $employeesWithDeductionsQuery = EmployeeDeduction::query();
        if ($useFilters) {
            $employeesWithDeductionsQuery->where('pay_period_month', $currentMonth)
                ->where('pay_period_year', $currentYear);
        }
        $employeesWithDeductions = $employeesWithDeductionsQuery->distinct('employee_id')
            ->count('employee_id');

        // Employees by office
        $employeesByOffice = Office::withCount('employees')
            ->orderBy('employees_count', 'desc')
            ->get();

        // Recent employees with their total deductions this month (or all if no filter)
        $recentEmployeesQuery = Employee::with(['office', 'employmentStatus'])
            ->withSum(['deductions as total_deductions' => function ($query) use ($currentMonth, $currentYear, $useFilters) {
                if ($useFilters) {
                    $query->where('pay_period_month', $currentMonth)
                        ->where('pay_period_year', $currentYear);
                }
            }], 'amount')
            ->whereHas('deductions'); // Only show employees who have at least one deduction

        if ($useFilters) {
            $recentEmployeesQuery->whereHas('deductions', function ($query) use ($currentMonth, $currentYear) {
                $query->where('pay_period_month', $currentMonth)
                    ->where('pay_period_year', $currentYear);
            });
        }

        $recentEmployeesWithDeductions = $recentEmployeesQuery
            ->latest()
            ->limit(5)
            ->get();

        // Top deduction types this month (or all if no filter)
        $topDeductionTypesQuery = EmployeeDeduction::query();
        if ($useFilters) {
            $topDeductionTypesQuery->where('pay_period_month', $currentMonth)
                ->where('pay_period_year', $currentYear);
        }
        $topDeductionTypes = $topDeductionTypesQuery
            ->selectRaw('deduction_type_id, SUM(amount) as total_amount, COUNT(*) as count')
            ->groupBy('deduction_type_id')
            ->with('deductionType')
            ->orderByDesc('total_amount')
            ->limit(5)
            ->get();

        // Claims stats (or all if no filter)
        $claimsQuery = Claim::query();
        if ($useFilters) {
            $claimsQuery->whereMonth('claim_date', $currentMonth)
                ->whereYear('claim_date', $currentYear);
        }
        $totalClaims = $claimsQuery->count();
        $totalClaimsAmount = $claimsQuery->sum('amount');

        // Compensation totals — cumulative based on effective periods
        // OPTIMIZED + CACHED: Expensive computation cached for 1 hour
        $masterData = Cache::remember('dashboard_master_data', 3600, function () {
            $cumulativeTotal = function ($records, $hasEndDate = false) {
                $total = 0;
                $grouped = $records->groupBy('employee_id');
                foreach ($grouped as $empId => $empRecords) {
                    $sorted = $empRecords->sortBy('effective_date')->values();
                    for ($i = 0; $i < $sorted->count(); $i++) {
                        $rec = $sorted[$i];
                        $start = \Carbon\Carbon::parse($rec->effective_date)->startOfMonth();
                        if ($hasEndDate && $rec->end_date) {
                            $end = \Carbon\Carbon::parse($rec->end_date)->startOfMonth();
                        } elseif ($i + 1 < $sorted->count()) {
                            $end = \Carbon\Carbon::parse($sorted[$i + 1]->effective_date)->startOfMonth();
                        } else {
                            $end = now()->startOfMonth();
                        }
                        $months = max(1, $start->diffInMonths($end));
                        $total += $rec->amount * $months;
                    }
                }
                return $total;
            };

            $totalSalaries = $cumulativeTotal(Salary::select('id', 'employee_id', 'amount', 'effective_date', 'end_date')->get(), true);
            $totalPera = $cumulativeTotal(Pera::select('id', 'employee_id', 'amount', 'effective_date')->get(), false);
            $totalRata = $cumulativeTotal(Rata::select('id', 'employee_id', 'amount', 'effective_date')->get(), false);

            // Salary Distribution by Fund and Code
            $allSourceOfFundCodes = SourceOfFundCode::where('status', true)
                ->with('generalFund')
                ->orderBy('code')
                ->get();

            $salaryRecords = Salary::select('id', 'employee_id', 'amount', 'effective_date', 'end_date', 'source_of_fund_code_id')
                ->with('sourceOfFundCode')
                ->get();
            $salariesByCode = [];

            $salaryGrouped = $salaryRecords->groupBy('employee_id');
            foreach ($salaryGrouped as $empId => $empRecords) {
                $sorted = $empRecords->sortBy('effective_date')->values();
                for ($i = 0; $i < $sorted->count(); $i++) {
                    $rec = $sorted[$i];
                    $codeId = $rec->source_of_fund_code_id;
                    if (! $codeId) continue;

                    $start = \Carbon\Carbon::parse($rec->effective_date)->startOfMonth();
                    if ($rec->end_date) {
                        $end = \Carbon\Carbon::parse($rec->end_date)->startOfMonth();
                    } elseif ($i + 1 < $sorted->count()) {
                        $end = \Carbon\Carbon::parse($sorted[$i + 1]->effective_date)->startOfMonth();
                    } else {
                        $end = now()->startOfMonth();
                    }
                    $months = max(1, $start->diffInMonths($end));
                    $cumulative = $rec->amount * $months;

                    if (! isset($salariesByCode[$codeId])) {
                        $codeInfo = $allSourceOfFundCodes->firstWhere('id', $codeId);
                        $salariesByCode[$codeId] = [
                            'code_id' => $codeId,
                            'code' => $codeInfo->code ?? '',
                            'code_description' => $codeInfo->description ?? '',
                            'general_fund_id' => $codeInfo->general_fund_id ?? null,
                            'total_amount' => 0,
                            'employee_count' => [],
                        ];
                    }
                    $salariesByCode[$codeId]['total_amount'] += $cumulative;
                    $salariesByCode[$codeId]['employee_count'][$empId] = true;
                }
            }

            $salariesByCode = collect(array_values($salariesByCode))->map(function ($item) {
                $item['employee_count'] = count($item['employee_count']);
                return $item;
            });

            $salariesByFundDistribution = $allSourceOfFundCodes->groupBy('general_fund_id')->map(function ($codes) use ($salariesByCode) {
                $fundCodes = $codes->map(function ($code) use ($salariesByCode) {
                    $existing = $salariesByCode->firstWhere('code_id', $code->id);

                    return [
                        'code_id' => $code->id,
                        'code' => $code->code,
                        'code_description' => $code->description,
                        'total_amount' => $existing ? $existing['total_amount'] : 0.0,
                        'employee_count' => $existing ? $existing['employee_count'] : 0,
                    ];
                });

                $fundTotal = $fundCodes->sum('total_amount');
                $fundEmployees = $fundCodes->sum('employee_count');

                return [
                    'codes' => $fundCodes->values(),
                    'total_amount' => $fundTotal,
                    'employee_count' => $fundEmployees,
                ];
            });

            $allGeneralFunds = GeneralFund::where('status', true)->orderBy('code')->get();
            $salaryDistribution = $allGeneralFunds->map(function ($fund) use ($salariesByFundDistribution) {
                $existing = $salariesByFundDistribution->get($fund->id);

                return [
                    'id' => $fund->id,
                    'code' => $fund->code,
                    'description' => $fund->description,
                    'codes' => $existing ? $existing['codes'] : [],
                    'total_amount' => $existing ? $existing['total_amount'] : 0.0,
                    'employee_count' => $existing ? $existing['employee_count'] : 0,
                ];
            })->values();

            $salariesByFund = $salaryDistribution->map(function ($fund) {
                return [
                    'id' => $fund['id'],
                    'code' => $fund['code'],
                    'description' => $fund['description'],
                    'total_amount' => $fund['total_amount'],
                ];
            });

            return compact('totalSalaries', 'totalPera', 'totalRata', 'salaryDistribution', 'salariesByFund');
        });

        extract($masterData);

        // Recent activity (placeholder - can be enhanced with actual activity log)
        $recentActivity = [];

        // Highest Travel Claims this month (or all if no filter)
        $travelClaimsQuery = Claim::whereHas('claimType', function ($query) {
            $query->where('code', 'TRAVEL');
        })->with(['employee.office']);

        if ($useFilters) {
            $travelClaimsQuery->whereMonth('claim_date', $currentMonth)
                ->whereYear('claim_date', $currentYear);
        }

        $highestTravelClaims = $travelClaimsQuery->orderByDesc('amount')
            ->limit(5)
            ->get()
            ->map(function ($claim) {
                return [
                    'id' => $claim->id,
                    'employee_name' => $claim->employee->last_name . ', ' . $claim->employee->first_name,
                    'office' => $claim->employee->office?->name ?? 'N/A',
                    'amount' => (float) $claim->amount,
                    'claim_date' => $claim->claim_date,
                    'purpose' => $claim->purpose,
                ];
            });

        // Top Employees by Total Claims Amount this month (or all if no filter)
        // OPTIMIZATION: Replaced N+1 by selecting employee_id first, then loading employees+offices in 2 queries
        $topClaimantsQuery = Claim::query();

        if ($useFilters) {
            $topClaimantsQuery->whereMonth('claim_date', $currentMonth)
                ->whereYear('claim_date', $currentYear);
        }

        $topClaimantsAggregates = $topClaimantsQuery
            ->selectRaw('employee_id, SUM(amount) as total_amount, COUNT(*) as claim_count')
            ->groupBy('employee_id')
            ->orderByDesc('total_amount')
            ->limit(5)
            ->get();

        $topClaimantEmployeeIds = $topClaimantsAggregates->pluck('employee_id')->all();
        $topClaimantEmployees = Employee::with('office')
            ->whereIn('id', $topClaimantEmployeeIds)
            ->get()
            ->keyBy('id');

        $topClaimants = $topClaimantsAggregates->map(function ($item) use ($topClaimantEmployees) {
            $employee = $topClaimantEmployees->get($item->employee_id);
            return [
                'employee_id' => $item->employee_id,
                'employee_name' => ($employee?->last_name ?? '') . ', ' . ($employee?->first_name ?? ''),
                'office' => $employee?->office?->name ?? 'N/A',
                'total_amount' => (float) $item->total_amount,
                'claim_count' => (int) $item->claim_count,
            ];
        });

        // Top 10 Employees with Most Travel Claims (by amount) - Includes Travel Reimbursement + Meal Allowance + Cash Advance - Travel
        $mostTravelClaimsQuery = Claim::whereHas('claimType', function ($query) {
            $query->whereIn('code', ['TRAVEL', 'MEAL', 'CASH_ADVANCE_TRAVEL']);
        });

        if ($useFilters) {
            $mostTravelClaimsQuery->whereMonth('claim_date', $currentMonth)
                ->whereYear('claim_date', $currentYear);
        }

        $mostTravelAggregates = $mostTravelClaimsQuery
            ->selectRaw('employee_id, COUNT(*) as travel_count, SUM(amount) as total_travel_amount')
            ->groupBy('employee_id')
            ->orderByDesc('total_travel_amount')
            ->limit(10)
            ->get();

        $mostTravelEmployeeIds = $mostTravelAggregates->pluck('employee_id')->all();
        $mostTravelEmployees = Employee::with('office')
            ->whereIn('id', $mostTravelEmployeeIds)
            ->get()
            ->keyBy('id');

        $mostTravelClaims = $mostTravelAggregates->map(function ($item) use ($mostTravelEmployees) {
            $employee = $mostTravelEmployees->get($item->employee_id);
            return [
                'employee_id' => $item->employee_id,
                'employee_name' => ($employee?->last_name ?? '') . ', ' . ($employee?->first_name ?? ''),
                'office' => $employee?->office?->name ?? 'N/A',
                'travel_count' => (int) $item->travel_count,
                'total_travel_amount' => (float) $item->total_travel_amount,
            ];
        });

        // Top 10 Employees with Most Travel Trips (by count, not amount) - Travel Reimbursement + Cash Advance - Travel
        $mostTripsQuery = Claim::whereHas('claimType', function ($query) {
            $query->whereIn('code', ['TRAVEL', 'CASH_ADVANCE_TRAVEL']);
        });

        if ($useFilters) {
            $mostTripsQuery->whereMonth('claim_date', $currentMonth)
                ->whereYear('claim_date', $currentYear);
        }

        $mostTripsAggregates = $mostTripsQuery
            ->selectRaw('employee_id, COUNT(*) as travel_count, SUM(amount) as total_travel_amount')
            ->groupBy('employee_id')
            ->orderByDesc('travel_count')
            ->limit(10)
            ->get();

        $mostTripsEmployeeIds = $mostTripsAggregates->pluck('employee_id')->all();
        $mostTripsEmployees = Employee::with('office')
            ->whereIn('id', $mostTripsEmployeeIds)
            ->get()
            ->keyBy('id');

        $mostTrips = $mostTripsAggregates->map(function ($item) use ($mostTripsEmployees) {
            $employee = $mostTripsEmployees->get($item->employee_id);
            return [
                'employee_id' => $item->employee_id,
                'employee_name' => ($employee?->last_name ?? '') . ', ' . ($employee?->first_name ?? ''),
                'office' => $employee?->office?->name ?? 'N/A',
                'travel_count' => (int) $item->travel_count,
                'total_travel_amount' => (float) $item->total_travel_amount,
            ];
        });

        // Top 10 Employees with Most Overtime Claims (by amount)
        $mostOvertimeClaimsQuery = Claim::whereHas('claimType', function ($query) {
            $query->where('code', 'OVERTIME');
        });

        if ($useFilters) {
            $mostOvertimeClaimsQuery->whereMonth('claim_date', $currentMonth)
                ->whereYear('claim_date', $currentYear);
        }

        $mostOvertimeAggregates = $mostOvertimeClaimsQuery
            ->selectRaw('employee_id, COUNT(*) as overtime_count, SUM(amount) as total_overtime_amount')
            ->groupBy('employee_id')
            ->orderByDesc('total_overtime_amount')
            ->limit(10)
            ->get();

        $mostOvertimeEmployeeIds = $mostOvertimeAggregates->pluck('employee_id')->all();
        $mostOvertimeEmployees = Employee::with('office')
            ->whereIn('id', $mostOvertimeEmployeeIds)
            ->get()
            ->keyBy('id');

        $mostOvertimeClaims = $mostOvertimeAggregates->map(function ($item) use ($mostOvertimeEmployees) {
            $employee = $mostOvertimeEmployees->get($item->employee_id);
            return [
                'employee_id' => $item->employee_id,
                'employee_name' => ($employee?->last_name ?? '') . ', ' . ($employee?->first_name ?? ''),
                'office' => $employee?->office?->name ?? 'N/A',
                'overtime_count' => (int) $item->overtime_count,
                'total_overtime_amount' => (float) $item->total_overtime_amount,
            ];
        });

        // Claims by Office - Travel and Meal claims
        $claimsByOfficeQuery = Claim::whereHas('claimType', function ($q) {
            $q->whereIn('code', ['TRAVEL', 'MEAL']);
        })->with('employee.office');

        if ($useFilters) {
            $claimsByOfficeQuery->whereMonth('claim_date', $currentMonth)
                ->whereYear('claim_date', $currentYear);
        }

        $claimsByOffice = $claimsByOfficeQuery
            ->get()
            ->groupBy(function ($claim) {
                return $claim->employee->office?->id ?? 0;
            })
            ->map(function ($claims, $officeId) {
                $office = $claims->first()->employee->office;

                return [
                    'office_name' => $office?->name ?? 'Unknown',
                    'office_code' => $office?->code ?? 'N/A',
                    'total_claims' => (int) $claims->count(),
                    'total_amount' => (float) $claims->sum('amount'),
                ];
            })
            ->values()
            ->sortByDesc('total_amount')
            ->values();

        // Overtime Claims by Office
        $overtimeByOfficeQuery = Claim::whereHas('claimType', function ($q) {
            $q->where('code', 'OVERTIME');
        })->with('employee.office');

        if ($useFilters) {
            $overtimeByOfficeQuery->whereMonth('claim_date', $currentMonth)
                ->whereYear('claim_date', $currentYear);
        }

        $overtimeByOffice = $overtimeByOfficeQuery
            ->get()
            ->groupBy(function ($claim) {
                return $claim->employee->office?->id ?? 0;
            })
            ->map(function ($claims, $officeId) {
                $office = $claims->first()->employee->office;

                return [
                    'office_name' => $office?->name ?? 'Unknown',
                    'office_code' => $office?->code ?? 'N/A',
                    'total_claims' => (int) $claims->count(),
                    'total_amount' => (float) $claims->sum('amount'),
                ];
            })
            ->values()
            ->sortByDesc('total_amount')
            ->values();

        // Employees by employment status
        $employeesByEmploymentStatus = EmploymentStatus::withCount('employees')
            ->orderBy('employees_count', 'desc')
            ->get()
            ->map(function ($status) {
                return [
                    'id' => $status->id,
                    'name' => $status->name,
                    'count' => $status->employees_count,
                ];
            });

        // Top 10 Suppliers by Transaction Amount
        $topSuppliersQuery = Supplier::query();

        if ($useFilters) {
            $topSuppliersQuery->whereHas('transactions', function ($query) use ($currentMonth, $currentYear) {
                $query->whereMonth('date_processed', $currentMonth)
                    ->whereYear('date_processed', $currentYear);
            });
        }

        $topSuppliers = $topSuppliersQuery
            ->withSum(['transactions as total_amount' => function ($query) use ($currentMonth, $currentYear, $useFilters) {
                if ($useFilters) {
                    $query->whereMonth('date_processed', $currentMonth)
                        ->whereYear('date_processed', $currentYear);
                }
            }], 'net_amount')
            ->withCount(['transactions as transaction_count' => function ($query) use ($currentMonth, $currentYear, $useFilters) {
                if ($useFilters) {
                    $query->whereMonth('date_processed', $currentMonth)
                        ->whereYear('date_processed', $currentYear);
                }
            }])
            ->whereHas('transactions')
            ->orderByDesc('total_amount')
            ->limit(10)
            ->get()
            ->map(function ($supplier) {
                return [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'owner_name' => $supplier->owner_name,
                    'contact_number' => $supplier->contact_number,
                    'total_amount' => (float) ($supplier->total_amount ?? 0),
                    'transaction_count' => (int) ($supplier->transaction_count ?? 0),
                ];
            });

        return Inertia::render('dashboard', [
            'stats' => [
                'totalEmployees' => $totalEmployees,
                'totalOffices' => $totalOffices,
                'totalDeductionTypes' => $totalDeductionTypes,
                'monthlyDeductionsCount' => $monthlyDeductionsCount,
                'monthlyDeductionsTotal' => (float) $monthlyDeductionsTotal,
                'employeesWithDeductions' => $employeesWithDeductions,
                'totalClaims' => $totalClaims,
                'totalClaimsAmount' => (float) $totalClaimsAmount,
                'totalSalaries' => (float) $totalSalaries,
                'totalPera' => (float) $totalPera,
                'totalRata' => (float) $totalRata,
                // Trend data
                'employeeGrowth' => $employeeGrowth,
                'officesThisYear' => $officesThisYear,
                'claimsThisWeek' => $claimsThisWeek,
            ],
            'salariesBySourceOfFund' => $salariesByFund,
            'salaryDistribution' => $salaryDistribution,
            'filters' => [
                'month' => (int) $month,
                'year' => (int) $year,
            ],
            'employeesByOffice' => $employeesByOffice,
            'employeesByEmploymentStatus' => $employeesByEmploymentStatus,
            'recentEmployeesWithDeductions' => $recentEmployeesWithDeductions,
            'topDeductionTypes' => $topDeductionTypes,
            'currentPeriod' => [
                'month' => $currentMonth,
                'year' => $currentYear,
                'monthName' => now()->format('F'),
            ],
            'recentActivity' => $recentActivity,
            'highestTravelClaims' => $highestTravelClaims,
            'topClaimants' => $topClaimants,
            'mostTravelClaims' => $mostTravelClaims,
            'mostTrips' => $mostTrips,
            'mostOvertimeClaims' => $mostOvertimeClaims,
            'claimsByOffice' => $claimsByOffice,
            'overtimeByOffice' => $overtimeByOffice,
            'topSuppliers' => $topSuppliers,
        ]);
    }
}
