<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\GeneralFund;
use App\Models\Office;
use App\Models\Salary;
use App\Models\SourceOfFundCode;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SalaryController extends Controller
{
    use HandlesDeletionRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Salary::class);
        $search = $request->input('search');
        $officeId = $request->input('office_id');
        $employmentStatusId = $request->input('employment_status_id');
        $month = $request->input('month');
        $year = $request->input('year');

        $employees = Employee::query()
            ->when($month && $year, function ($query) use ($month, $year) {
                // If month/year filter is applied, only show employees with salaries in that period
                $query->whereHas('salaries', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            }, function ($query) {
                // If no month/year filter, show all employees who have ANY salary record
                $query->has('salaries');
            })
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($employmentStatusId, function ($query, $employmentStatusId) {
                $query->where('employment_status_id', $employmentStatusId);
            })
            ->with(['employmentStatus', 'office', 'latestSalary'])
            ->orderBy('last_name', 'asc')
            ->paginate(50)
            ->withQueryString();

        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();
        $sourceOfFundCodes = SourceOfFundCode::where('status', true)->orderBy('code')->get();

        return Inertia::render('salaries/index', [
            'employees' => $employees,
            'offices' => $offices,
            'employmentStatuses' => $employmentStatuses,
            'sourceOfFundCodes' => $sourceOfFundCodes,
            'filters' => [
                'search' => $search,
                'office_id' => $officeId,
                'employment_status_id' => $employmentStatusId,
                'month' => $month,
                'year' => $year,
            ],
        ]);
    }

    public function print(Request $request)
    {
        $this->authorize('viewAny', Salary::class);
        $month = $request->input('month');
        $year = $request->input('year');

        $employees = Employee::query()
            ->has('salaries')
            ->when($month && $year, function ($query) use ($month, $year) {
                $query->whereHas('salaries', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            })
            ->with(['office', 'latestSalary'])
            ->orderBy('last_name', 'asc')
            ->get();

        $totalSalary = $employees->sum(function ($employee) {
            return $employee->latest_salary ? (float) $employee->latest_salary->amount : 0;
        });

        return Inertia::render('salaries/print', [
            'employees' => $employees,
            'month' => $month,
            'year' => $year,
            'totalSalary' => $totalSalary,
        ]);
    }

    public function history(Request $request, Employee $employee)
    {
        $this->authorize('viewAny', Salary::class);
        $salaries = $employee->salaries()
            ->with('createdBy')
            ->orderBy('effective_date', 'desc')
            ->get();

        return Inertia::render('salaries/history', [
            'employee' => $employee->load(['employmentStatus', 'office']),
            'salaries' => $salaries,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Salary::class);
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'source_of_fund_code_id' => 'nullable|exists:source_of_fund_codes,id',
        ]);

        Salary::create([
            'employee_id' => $validated['employee_id'],
            'amount' => $validated['amount'],
            'effective_date' => $validated['effective_date'],
            'source_of_fund_code_id' => $validated['source_of_fund_code_id'] ?? null,
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Salary added successfully');
    }

    public function update(Request $request, Salary $salary)
    {
        $this->authorize('update', $salary);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'source_of_fund_code_id' => 'nullable|exists:source_of_fund_codes,id',
        ]);

        $salary->update([
            'amount' => $validated['amount'],
            'effective_date' => $validated['effective_date'],
            'source_of_fund_code_id' => $validated['source_of_fund_code_id'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Salary record updated successfully');
    }

    public function destroy(Salary $salary)
    {
        return $this->handleDeletion($salary, 'salaries.delete');
    }

    /**
     * Display salary amounts grouped by office and source of fund code.
     */
    public function byOfficeFund(Request $request)
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        $officeId = $request->input('office_id');

        $periodStart = now()->setDate((int) $year, (int) $month, 1)->startOfMonth();
        $periodEnd = now()->setDate((int) $year, (int) $month, 1)->endOfMonth();

        // Get all active source of fund codes with their general fund
        $sourceOfFundCodes = SourceOfFundCode::where('status', true)
            ->with('generalFund:id,code,description,status')
            ->orderBy('code')
            ->get();

        // Build a lookup for general fund names
        $generalFundsLookup = GeneralFund::where('status', true)
            ->get()
            ->keyBy('id')
            ->map(fn ($gf) => [
                'name' => $gf->description,
                'code' => $gf->code,
                'description' => $gf->description,
            ]);

        // Get all offices for the filter dropdown
        $allOffices = Office::orderBy('name')->get(['id', 'name']);

        // Get offices to display — filter by office_id if provided
        $offices = $allOffices;
        if ($officeId) {
            $offices = $allOffices->where('id', (int) $officeId);
        }

        // Query salaries effective in the given period, grouped by office and source of fund code
        $salaryQuery = Salary::query()
            ->join('employees', 'salaries.employee_id', '=', 'employees.id')
            ->where('salaries.effective_date', '<=', $periodEnd)
            ->where(function ($q) use ($periodStart) {
                $q->whereNull('salaries.end_date')
                  ->orWhere('salaries.end_date', '>=', $periodStart);
            });

        if ($officeId) {
            $salaryQuery->where('employees.office_id', (int) $officeId);
        }

        $salaryData = $salaryQuery
            ->selectRaw('employees.office_id, salaries.source_of_fund_code_id, SUM(salaries.amount) as total_amount, COUNT(DISTINCT salaries.employee_id) as employee_count')
            ->groupBy('employees.office_id', 'salaries.source_of_fund_code_id')
            ->get();

        // Build the office-by-office breakdown
        $officeFundData = $offices->map(function ($office) use ($salaryData, $sourceOfFundCodes, $generalFundsLookup) {
            $officeSalaries = $salaryData->where('office_id', $office->id);
            $funds = [];

            foreach ($officeSalaries as $row) {
                $codeId = $row->source_of_fund_code_id;
                $fundCode = $sourceOfFundCodes->firstWhere('id', $codeId);

                if (!$fundCode) continue;

                $generalFund = $generalFundsLookup->get($fundCode->general_fund_id);
                $generalFundName = $generalFund['name'] ?? null;
                $generalFundCode = $generalFund['code'] ?? null;

                $funds[] = [
                    'source_of_fund_code_id' => $codeId,
                    'code' => $fundCode->code,
                    'code_description' => $fundCode->description,
                    'general_fund_name' => $generalFundName,
                    'general_fund_code' => $generalFundCode,
                    'total_amount' => (float) $row->total_amount,
                    'employee_count' => (int) $row->employee_count,
                ];
            }

            // Sort funds by amount descending
            usort($funds, fn($a, $b) => $b['total_amount'] <=> $a['total_amount']);

            return [
                'id' => $office->id,
                'name' => $office->name,
                'funds' => $funds,
                'total_amount' => (float) collect($funds)->sum('total_amount'),
            ];
        })->filter(fn($office) => $office['total_amount'] > 0)->values();

        // Summary stats
        $summary = [
            'total_offices' => $officeFundData->count(),
            'total_fund_codes' => $sourceOfFundCodes->count(),
            'total_amount' => (float) $officeFundData->sum('total_amount'),
        ];

        $months = [
            ['value' => '1', 'label' => 'January'],
            ['value' => '2', 'label' => 'February'],
            ['value' => '3', 'label' => 'March'],
            ['value' => '4', 'label' => 'April'],
            ['value' => '5', 'label' => 'May'],
            ['value' => '6', 'label' => 'June'],
            ['value' => '7', 'label' => 'July'],
            ['value' => '8', 'label' => 'August'],
            ['value' => '9', 'label' => 'September'],
            ['value' => '10', 'label' => 'October'],
            ['value' => '11', 'label' => 'November'],
            ['value' => '12', 'label' => 'December'],
        ];

        return Inertia::render('reports/SalariesByOfficeFund', [
            'offices' => $officeFundData,
            'allOffices' => $allOffices,
            'sourceOfFundCodes' => $sourceOfFundCodes->map(fn($c) => [
                'id' => $c->id,
                'code' => $c->code,
                'description' => $c->description,
            ]),
            'summary' => $summary,
            'months' => $months,
            'filters' => [
                'month' => (int) $month,
                'year' => (int) $year,
                'office_id' => $officeId ? (int) $officeId : null,
            ],
        ]);
    }

    /**
     * Print report of salary amounts grouped by office and source of fund code.
     */
    public function byOfficeFundPrint(Request $request)
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        $officeId = $request->input('office_id');

        $periodStart = now()->setDate((int) $year, (int) $month, 1)->startOfMonth();
        $periodEnd = now()->setDate((int) $year, (int) $month, 1)->endOfMonth();

        // Get all active source of fund codes with their general fund
        $sourceOfFundCodes = SourceOfFundCode::where('status', true)
            ->with('generalFund:id,code,description,status')
            ->orderBy('code')
            ->get();

        // Build a lookup for general fund names
        $generalFundsLookup = GeneralFund::where('status', true)
            ->get()
            ->keyBy('id')
            ->map(fn ($gf) => [
                'name' => $gf->description,
                'code' => $gf->code,
                'description' => $gf->description,
            ]);

        // Get all offices
        $allOffices = Office::orderBy('name')->get(['id', 'name']);

        // Get offices to display — filter by office_id if provided
        $offices = $allOffices;
        if ($officeId) {
            $offices = $allOffices->where('id', (int) $officeId);
        }

        // Query salaries effective in the given period, grouped by office and source of fund code
        $salaryQuery = Salary::query()
            ->join('employees', 'salaries.employee_id', '=', 'employees.id')
            ->where('salaries.effective_date', '<=', $periodEnd)
            ->where(function ($q) use ($periodStart) {
                $q->whereNull('salaries.end_date')
                  ->orWhere('salaries.end_date', '>=', $periodStart);
            });

        if ($officeId) {
            $salaryQuery->where('employees.office_id', (int) $officeId);
        }

        $salaryData = $salaryQuery
            ->selectRaw('employees.office_id, salaries.source_of_fund_code_id, SUM(salaries.amount) as total_amount, COUNT(DISTINCT salaries.employee_id) as employee_count')
            ->groupBy('employees.office_id', 'salaries.source_of_fund_code_id')
            ->get();

        // Build the office-by-office breakdown
        $officeFundData = $offices->map(function ($office) use ($salaryData, $sourceOfFundCodes, $generalFundsLookup) {
            $officeSalaries = $salaryData->where('office_id', $office->id);
            $funds = [];

            foreach ($officeSalaries as $row) {
                $codeId = $row->source_of_fund_code_id;
                $fundCode = $sourceOfFundCodes->firstWhere('id', $codeId);

                if (!$fundCode) continue;

                $generalFund = $generalFundsLookup->get($fundCode->general_fund_id);
                $generalFundName = $generalFund['name'] ?? null;
                $generalFundCode = $generalFund['code'] ?? null;

                $funds[] = [
                    'source_of_fund_code_id' => $codeId,
                    'code' => $fundCode->code,
                    'code_description' => $fundCode->description,
                    'general_fund_name' => $generalFundName,
                    'general_fund_code' => $generalFundCode,
                    'total_amount' => (float) $row->total_amount,
                    'employee_count' => (int) $row->employee_count,
                ];
            }

            usort($funds, fn($a, $b) => $b['total_amount'] <=> $a['total_amount']);

            return [
                'id' => $office->id,
                'name' => $office->name,
                'funds' => $funds,
                'total_amount' => (float) collect($funds)->sum('total_amount'),
            ];
        })->filter(fn($office) => $office['total_amount'] > 0)->values();

        $months = [
            '1' => 'January', '2' => 'February', '3' => 'March',
            '4' => 'April', '5' => 'May', '6' => 'June',
            '7' => 'July', '8' => 'August', '9' => 'September',
            '10' => 'October', '11' => 'November', '12' => 'December',
        ];

        // Get the selected office name for display
        $selectedOfficeName = null;
        if ($officeId) {
            $selectedOffice = $allOffices->firstWhere('id', (int) $officeId);
            $selectedOfficeName = $selectedOffice?->name;
        }

        return Inertia::render('reports/SalariesByOfficeFundPrint', [
            'offices' => $officeFundData,
            'filters' => [
                'month' => (int) $month,
                'year' => (int) $year,
                'monthName' => $months[(int) $month] ?? 'Unknown',
                'office_id' => $officeId ? (int) $officeId : null,
                'officeName' => $selectedOfficeName,
            ],
        ]);
    }
}
