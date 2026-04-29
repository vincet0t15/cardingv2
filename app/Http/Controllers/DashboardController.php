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
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if ($user) {
            // Check if user has linked employee
            $userEmployee = Employee::where('user_id', $user->id)->first();

            // Determine if user is strictly an employee only
            $roleNames = $user->roles->pluck('name')->map(fn($role) => strtolower(trim($role)))->toArray();
            $hasOnlyEmployeeRole = count($roleNames) === 1 && in_array('employee', $roleNames, true);

            // Check if user has any privileged/admin role
            $isAdmin = DB::table('model_has_roles')
                ->where('model_id', $user->id)
                ->whereIn('role_id', function ($q) {
                    $q->select('id')->from('roles')->whereIn('name', ['super admin', 'admin']);
                })->exists();

            // If linked employee and only has the employee role → employee dashboard
            if ($userEmployee && $hasOnlyEmployeeRole) {
                return redirect()->route('employee.dashboard');
            }

            // If not linked and not admin → redirect to employees page
            if (! $userEmployee && ! $isAdmin) {
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

        // Compensation totals (current year only)
        $totalSalaries = Salary::whereYear('effective_date', $currentYear)->sum('amount');
        $totalPera = Pera::whereYear('effective_date', $currentYear)->sum('amount');
        $totalRata = Rata::whereYear('effective_date', $currentYear)->sum('amount');

        // Salaries by General Fund breakdown for selected month/year (or all if no filter)
        $allGeneralFunds = GeneralFund::where('status', true)
            ->orderBy('code')
            ->get();

        $salariesQuery = Salary::selectRaw('source_of_fund_codes.general_fund_id, SUM(salaries.amount) as total_amount')
            ->join('source_of_fund_codes', 'salaries.source_of_fund_code_id', '=', 'source_of_fund_codes.id');

        if ($useFilters) {
            $salariesQuery->whereYear('salaries.effective_date', $year);
            if ($month) {
                $salariesQuery->whereMonth('salaries.effective_date', $month);
            }
        }

        $salariesByGeneralFund = $salariesQuery
            ->groupBy('source_of_fund_codes.general_fund_id')
            ->get()
            ->map(function ($item) {
                return [
                    'general_fund_id' => $item->general_fund_id,
                    'total_amount' => (float) $item->total_amount,
                ];
            });

        // Merge with all general funds to include those with 0 amounts
        $salariesByFund = $allGeneralFunds->map(function ($fund) use ($salariesByGeneralFund) {
            $existing = $salariesByGeneralFund->firstWhere('general_fund_id', $fund->id);

            if ($existing) {
                return [
                    'id' => $fund->id,
                    'code' => $fund->code,
                    'description' => $fund->description,
                    'total_amount' => $existing['total_amount'],
                ];
            }

            // Return fund with 0 amount
            return [
                'id' => $fund->id,
                'code' => $fund->code,
                'description' => $fund->description,
                'total_amount' => 0.0,
            ];
        })->values();

        // Salary Distribution by Fund and Code
        $allSourceOfFundCodes = SourceOfFundCode::where('status', true)
            ->with('generalFund')
            ->orderBy('code')
            ->get();

        $salariesDistributionQuery = Salary::selectRaw('source_of_fund_codes.id as code_id, source_of_fund_codes.code, source_of_fund_codes.description as code_description, source_of_fund_codes.general_fund_id, SUM(salaries.amount) as total_amount, COUNT(DISTINCT salaries.employee_id) as employee_count')
            ->join('source_of_fund_codes', 'salaries.source_of_fund_code_id', '=', 'source_of_fund_codes.id');

        if ($useFilters) {
            $salariesDistributionQuery->whereYear('salaries.effective_date', $year);
            if ($month) {
                $salariesDistributionQuery->whereMonth('salaries.effective_date', $month);
            }
        }

        $salariesByCode = $salariesDistributionQuery
            ->groupBy('source_of_fund_codes.id', 'source_of_fund_codes.code', 'source_of_fund_codes.description', 'source_of_fund_codes.general_fund_id')
            ->get()
            ->map(function ($item) {
                return [
                    'code_id' => $item->code_id,
                    'code' => $item->code,
                    'code_description' => $item->code_description,
                    'general_fund_id' => $item->general_fund_id,
                    'total_amount' => (float) $item->total_amount,
                    'employee_count' => (int) $item->employee_count,
                ];
            });

        // Group by General Fund
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

        // Merge with all general funds
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
        $topClaimantsQuery = Claim::query();

        if ($useFilters) {
            $topClaimantsQuery->whereMonth('claim_date', $currentMonth)
                ->whereYear('claim_date', $currentYear);
        }

        $topClaimants = $topClaimantsQuery->selectRaw('employee_id, SUM(amount) as total_amount, COUNT(*) as claim_count')
            ->groupBy('employee_id')
            ->with(['employee.office'])
            ->orderByDesc('total_amount')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'employee_id' => $item->employee_id,
                    'employee_name' => $item->employee->last_name . ', ' . $item->employee->first_name,
                    'office' => $item->employee->office?->name ?? 'N/A',
                    'total_amount' => (float) $item->total_amount,
                    'claim_count' => (int) $item->claim_count,
                ];
            });

        // Top 10 Employees with Most Travel Claims (by amount) - Includes Travel Reimbursement + Meal Allowance
        $mostTravelClaimsQuery = Claim::whereHas('claimType', function ($query) {
            $query->whereIn('code', ['TRAVEL', 'MEAL']);
        })->with(['employee.office']);

        if ($useFilters) {
            $mostTravelClaimsQuery->whereMonth('claim_date', $currentMonth)
                ->whereYear('claim_date', $currentYear);
        }

        $mostTravelClaims = $mostTravelClaimsQuery->selectRaw('employee_id, COUNT(*) as travel_count, SUM(amount) as total_travel_amount')
            ->groupBy('employee_id')
            ->with(['employee.office'])
            ->orderByDesc('total_travel_amount')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'employee_id' => $item->employee_id,
                    'employee_name' => $item->employee->last_name . ', ' . $item->employee->first_name,
                    'office' => $item->employee->office?->name ?? 'N/A',
                    'travel_count' => (int) $item->travel_count,
                    'total_travel_amount' => (float) $item->total_travel_amount,
                ];
            });

        // Top 10 Employees with Most Overtime Claims (by amount)
        $mostOvertimeClaimsQuery = Claim::whereHas('claimType', function ($query) {
            $query->where('code', 'OVERTIME');
        })->with(['employee.office']);

        if ($useFilters) {
            $mostOvertimeClaimsQuery->whereMonth('claim_date', $currentMonth)
                ->whereYear('claim_date', $currentYear);
        }

        $mostOvertimeClaims = $mostOvertimeClaimsQuery->selectRaw('employee_id, COUNT(*) as overtime_count, SUM(amount) as total_overtime_amount')
            ->groupBy('employee_id')
            ->with(['employee.office'])
            ->orderByDesc('total_overtime_amount')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'employee_id' => $item->employee_id,
                    'employee_name' => $item->employee->last_name . ', ' . $item->employee->first_name,
                    'office' => $item->employee->office?->name ?? 'N/A',
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
            'mostOvertimeClaims' => $mostOvertimeClaims,
            'claimsByOffice' => $claimsByOffice,
            'overtimeByOffice' => $overtimeByOffice,
        ]);
    }
}
