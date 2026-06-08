<?php

namespace App\Http\Controllers;

use App\Models\Adjustment;
use App\Models\Claim;
use App\Models\ClothingAllowance;
use App\Models\DeleteRequest;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use App\Services\ManageEmployeeService;
use App\Traits\HandlesDeletionRequests;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ManageEmployeeController extends Controller
{
    use HandlesDeletionRequests;

    public function __construct(
        private ManageEmployeeService $service
    ) {}

    /**
     * Show the employee management page with tab-based data loading.
     */
    public function index(Request $request, Employee $employee)
    {
        $this->authorize('view', $employee);

        $tab = $request->query('tab', 'overview');
        $filterMonth = is_numeric($request->input('deduction_month'))
            ? (int) $request->input('deduction_month')
            : null;
        $filterYear = is_numeric($request->input('deduction_year'))
            ? (int) $request->input('deduction_year')
            : null;

        // Load employee with all core relationships
        $employee = $this->service->loadEmployee($employee);

        // Reference data (always needed)
        $refData = $this->service->getReferenceData();

        // Determine which data blocks to load
        $loadOverviewData = in_array($tab, ['overview', 'reports', 'deductions'], true);
        $loadDeductionData = in_array($tab, ['deductions', 'overview'], true);
        $loadClaimsData = $tab === 'claims';
        $loadAdjustmentsData = in_array($tab, ['adjustments', 'overview', 'reports', 'deductions'], true);
        $loadReportData = $tab === 'reports';

        // Shared data (claims + adjustments) — used by overview, deductions, reports
        $allClaims = collect();
        $adjustments = collect();
        if ($loadOverviewData || $loadDeductionData || $loadReportData || $loadAdjustmentsData) {
            $result = $this->service->getClaimsAndAdjustments($employee);
            $allClaims = $result['allClaims'];
            $adjustments = $result['adjustments'];
        }

        // Deduction data (periods, grouped deductions, years)
        $groupedDeductions = [];
        $periodsList = [];
        $takenPeriods = [];
        $availableYears = [];
        $allEmployees = collect();
        $allClaimsGrouped = [];
        $allAdjustmentsGrouped = [];
        $deductionsData = collect();
        $allPeriodsCount = 0;

        if ($loadDeductionData || $loadReportData) {
            $dedResult = $this->service->getDeductionData(
                $employee, $filterMonth, $filterYear, $allClaims, $adjustments
            );
            $groupedDeductions = $dedResult['groupedDeductions'];
            $deductionsData = $dedResult['deductionsData'];
            $periodsList = $dedResult['periodsList'];
            $takenPeriods = $dedResult['takenPeriods'];
            $availableYears = $dedResult['availableYears'];
            $allEmployees = $dedResult['allEmployees'];
            $allClaimsGrouped = $dedResult['allClaimsGrouped'];
            $allAdjustmentsGrouped = $dedResult['allAdjustmentsGrouped'];
            $allPeriodsCount = $dedResult['allPeriodsCount'];
        }

        // Overview/summary data (all-time totals)
        $allDeductions = [];
        $allClothingAllowances = collect();
        $totalDeductionsAllTime = 0;
        $totalClaimsAllTime = 0;
        $totalGrossAllTime = 0;
        $periodNetPaySummaries = [];

        if ($loadOverviewData || $loadReportData) {
            // Reuse deductionsData if already fetched (from deduction tab), otherwise fetch fresh
            $sourceData = $deductionsData->isNotEmpty()
                ? $deductionsData
                : EmployeeDeduction::where('employee_id', $employee->id)
                    ->with(['deductionType', 'salary'])
                    ->orderBy('pay_period_year', 'desc')
                    ->orderBy('pay_period_month', 'desc')
                    ->get();

            $overviewResult = $this->service->getOverviewData($employee, $sourceData, $allClaims);
            $allDeductions = $overviewResult['allDeductions'];
            $totalDeductionsAllTime = $overviewResult['totalDeductionsAllTime'];
            $totalClaimsAllTime = $overviewResult['totalClaimsAllTime'];
            $allClothingAllowances = $overviewResult['allClothingAllowances'];
            $totalGrossAllTime = $overviewResult['totalGrossAllTime'];
            $periodNetPaySummaries = $overviewResult['periodNetPaySummaries'];
        }

        // Claims tab data
        $claims = null;
        $claimTypes = [];
        $availableClaimYears = [];
        $claimMonth = null;
        $claimYear = null;
        $claimTypeId = null;

        if ($loadClaimsData) {
            $claimsResult = $this->service->getClaimsData($employee, $request);
            $claims = $claimsResult['claims'];
            $claimTypes = $claimsResult['claimTypes'];
            $availableClaimYears = $claimsResult['availableClaimYears'];
            $claimFilters = $claimsResult['claimFilters'];
            $claimMonth = $claimFilters['claim_month'];
            $claimYear = $claimFilters['claim_year'];
            $claimTypeId = $claimFilters['claim_type_id'];
        }

        // Adjustment statistics
        $adjustmentStatistics = ['total_processed' => 0, 'total_amount' => 0];
        if ($loadAdjustmentsData || $loadOverviewData || $loadReportData) {
            $adjustmentStatistics = $this->service->getAdjustmentStats($employee);
        }

        return Inertia::render('employees/Manage/Manage', [
            'employee' => $employee,
            'earliest_salary' => $employee->earliestSalary,
            'employmentStatuses' => $refData['employmentStatuses'],
            'offices' => $refData['offices'],
            'deductionTypes' => $refData['deductionTypes'],
            'sourceOfFundCodes' => $refData['sourceOfFundCodes'],
            'deductions' => $groupedDeductions,
            'periodsList' => $periodsList,
            'takenPeriods' => $takenPeriods,
            'availableYears' => $availableYears,
            'allEmployees' => $allEmployees,
            'filters' => [
                'deduction_month' => $filterMonth,
                'deduction_year' => $filterYear,
            ],
            'deductionPagination' => [
                'current_page' => 1,
                'last_page' => max(1, (int) ceil($allPeriodsCount / 50)),
                'per_page' => 50,
                'total' => $allPeriodsCount,
            ],
            'claims' => $claims ?? null,
            'claimTypes' => $claimTypes,
            'availableClaimYears' => $availableClaimYears,
            'claimFilters' => [
                'claim_month' => $claimMonth,
                'claim_year' => $claimYear,
                'claim_type_id' => $claimTypeId,
            ],
            'allDeductions' => $allDeductions,
            'allClaims' => $allClaims,
            'allClaimsGrouped' => $allClaimsGrouped,
            'allClothingAllowances' => $allClothingAllowances,
            'totalDeductionsAllTime' => $totalDeductionsAllTime,
            'totalClaimsAllTime' => $totalClaimsAllTime,
            'totalGrossAllTime' => $totalGrossAllTime,
            'periodNetPaySummaries' => $periodNetPaySummaries,
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
        return $this->handleDeletion($deduction, 'deductions.delete', null, true);
    }

    public function destroyDeductionsForPeriod(Request $request, Employee $employee)
    {
        $this->authorize('update', $employee);

        $validated = $request->validate([
            'pay_period_month' => 'required|integer|min:1|max:12',
            'pay_period_year' => 'required|integer|min:2020|max:2100',
        ]);

        $startOfMonth = Carbon::createFromDate($validated['pay_period_year'], $validated['pay_period_month'], 1)->startOfMonth();
        $endOfMonth = Carbon::createFromDate($validated['pay_period_year'], $validated['pay_period_month'], 1)->endOfMonth();

        $deductions = EmployeeDeduction::where('employee_id', $employee->id)
            ->where('pay_period_month', $validated['pay_period_month'])
            ->where('pay_period_year', $validated['pay_period_year'])
            ->get();

        $adjustments = Adjustment::where('employee_id', $employee->id)
            ->where('pay_period_month', $validated['pay_period_month'])
            ->where('pay_period_year', $validated['pay_period_year'])
            ->get();

        $clothingAllowances = ClothingAllowance::where('employee_id', $employee->id)
            ->whereBetween('start_date', [$startOfMonth, $endOfMonth])
            ->get();

        $totalItems = $deductions->count() + $adjustments->count() + $clothingAllowances->count();

        if ($totalItems === 0) {
            return back()->with('error', 'No items found for this period');
        }

        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        $firstItem = $deductions->first() ?? $adjustments->first() ?? $clothingAllowances->first();

        if (!$firstItem) {
            return back()->with('error', 'No items found for this period');
        }

        if (!$user) {
            return back()->with('error', 'User not authenticated');
        }

        $deductionCount = $deductions->count();
        $adjustmentCount = $adjustments->count();
        $clothingCount = $clothingAllowances->count();
        $hasEmployeeManagePermission = $user->can('employees.manage');

        $canDeleteDeductions = $hasEmployeeManagePermission || $deductionCount === 0
            || $user->can('deductions.manage') || $user->can('deductions.delete');
        $canDeleteAdjustments = $hasEmployeeManagePermission || $adjustmentCount === 0
            || $user->can('adjustments.manage') || $user->can('adjustments.delete');
        $canDeleteClothingAllowances = $hasEmployeeManagePermission || $clothingCount === 0
            || $user->can('clothing_allowances.delete');
        $canDeleteAllItems = $canDeleteDeductions && $canDeleteAdjustments && $canDeleteClothingAllowances;

        if ($canDeleteAllItems) {
            $deductions->each->delete();
            $adjustments->each->delete();
            $clothingAllowances->each->delete();

            return back()->with('success',
                "Deleted {$deductionCount} deduction(s), {$adjustmentCount} adjustment(s), "
                . "and {$clothingCount} clothing allowance(s) "
                . "for period {$validated['pay_period_month']}/{$validated['pay_period_year']}."
            );
        }

        $itemDetails = [];
        if ($deductionCount > 0) $itemDetails[] = "{$deductionCount} deduction(s)";
        if ($adjustmentCount > 0) $itemDetails[] = "{$adjustmentCount} adjustment(s)";
        if ($clothingCount > 0) $itemDetails[] = "{$clothingCount} clothing allowance(s)";

        $reason = $request->input('reason', 'Delete entire pay period - ' . implode(', ', $itemDetails));

        $deleteRequest = DeleteRequest::create([
            'requestable_type' => get_class($firstItem),
            'requestable_id' => $firstItem->id,
            'requested_by' => $user->id,
            'status' => DeleteRequest::STATUS_PENDING,
            'reason' => $reason,
        ]);

        $this->notifySuperAdminsOfDeletionRequest($deleteRequest, $firstItem, $user);

        return back()->with('success',
            "Your deletion request for period {$validated['pay_period_month']}/{$validated['pay_period_year']} "
            . "has been sent to administrators for approval."
        );
    }

    public function print(Request $request, Employee $employee)
    {
        $this->authorize('view', $employee);

        $filterMonth = $request->input('month');
        $filterYear = $request->input('year');
        $filterSalaryId = $request->input('salary_id');
        $printType = $request->input('type', 'all');

        $employee = Employee::with([
            'office', 'employmentStatus',
            'latestSalary', 'latestPera', 'latestRata', 'latestHazardPay', 'latestClothingAllowance',
            'salaries' => fn($q) => $q->orderBy('effective_date', 'desc'),
            'peras' => fn($q) => $q->orderBy('effective_date', 'desc'),
            'ratas' => fn($q) => $q->orderBy('effective_date', 'desc'),
            'hazardPays' => fn($q) => $q->orderBy('start_date', 'desc'),
            'clothingAllowances' => fn($q) => $q->orderBy('start_date', 'desc'),
        ])->findOrFail($employee->id);

        $allDeductions = EmployeeDeduction::with('deductionType', 'salary')
            ->where('employee_id', $employee->id)
            ->when($filterMonth, fn($q) => $q->where('pay_period_month', $filterMonth))
            ->when($filterYear, fn($q) => $q->where('pay_period_year', $filterYear))
            ->when($filterSalaryId !== null && $filterSalaryId !== '', function ($q) use ($filterSalaryId) {
                $filterSalaryId === 'null'
                    ? $q->whereNull('salary_id')
                    : $q->where('salary_id', $filterSalaryId);
            })
            ->orderBy('pay_period_year', 'desc')
            ->orderBy('pay_period_month', 'desc')
            ->get();

        $allClaims = Claim::with('claimType')
            ->where('employee_id', $employee->id)
            ->when($filterMonth, fn($q) => $q->whereMonth('claim_date', $filterMonth))
            ->when($filterYear, fn($q) => $q->whereYear('claim_date', $filterYear))
            ->orderBy('claim_date', 'desc')
            ->get();

        $allAdjustments = Adjustment::with(['adjustmentType', 'referenceType'])
            ->where('employee_id', $employee->id)
            ->where('status', '!=', 'rejected')
            ->when($filterMonth, fn($q) => $q->where('pay_period_month', $filterMonth))
            ->when($filterYear, fn($q) => $q->where('pay_period_year', $filterYear))
            ->orderBy('created_at', 'desc')
            ->get();

        $clothingAllowancesQuery = $employee->clothingAllowances();
        if ($filterMonth && $filterYear) {
            $periodStart = now()->setDate($filterYear, $filterMonth, 1)->startOfMonth();
            $periodEnd = now()->setDate($filterYear, $filterMonth, 1)->endOfMonth();
            $clothingAllowancesQuery
                ->where('start_date', '<=', $periodEnd)
                ->where(fn($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', $periodStart));
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
            'filterSalaryId' => $filterSalaryId,
            'printType' => $printType,
        ]);
    }
}
