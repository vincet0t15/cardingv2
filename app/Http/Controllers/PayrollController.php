<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\Office;
use App\Services\PayrollService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PayrollController extends Controller
{
    public function __construct(
        protected PayrollService $payrollService
    ) {}

    public function index(Request $request): Response
    {
        $month = $request->input('month'); // Can be null or 0 for "All Months"
        $year = $request->input('year', now()->year);
        $officeId = $request->input('office_id');
        $search = $request->input('search');
        $employmentStatusId = $request->input('employment_status_id');

        // If month is provided and not 0, use it for calculation; otherwise use 12 (December) as default
        $calculationMonth = ($month && $month != 0) ? $month : 12;

        $employees = Employee::query()
            ->with(['employmentStatus', 'office'])
            ->when($search, function ($query, $search) {
                $query->where('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            })
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($employmentStatusId, function ($query, $employmentStatusId) {
                $query->where('employment_status_id', $employmentStatusId);
            })
            ->with(['salaries' => function ($query) use ($year, $calculationMonth) {
                $query->where('effective_date', '<=', now()->setDate($year, $calculationMonth, 1)->endOfMonth())
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['peras' => function ($query) use ($year, $calculationMonth) {
                $query->where('effective_date', '<=', now()->setDate($year, $calculationMonth, 1)->endOfMonth())
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['ratas' => function ($query) use ($year, $calculationMonth) {
                $query->where('effective_date', '<=', now()->setDate($year, $calculationMonth, 1)->endOfMonth())
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['hazardPays' => function ($query) use ($year, $calculationMonth) {
                $periodEnd = now()->setDate($year, $calculationMonth, 1)->endOfMonth();
                $periodStart = now()->setDate($year, $calculationMonth, 1)->startOfMonth();
                $query->where('start_date', '<=', $periodEnd)
                    ->where(function ($q) use ($periodEnd, $periodStart) {
                        $q->whereNull('end_date')
                            ->orWhere('end_date', '>=', $periodStart);
                    })
                    ->orderBy('start_date', 'desc');
            }])
            ->with(['clothingAllowances' => function ($query) use ($year, $calculationMonth) {
                $periodEnd = now()->setDate($year, $calculationMonth, 1)->endOfMonth();
                $periodStart = now()->setDate($year, $calculationMonth, 1)->startOfMonth();
                $query->where('start_date', '<=', $periodEnd)
                    ->where(function ($q) use ($periodEnd, $periodStart) {
                        $q->whereNull('end_date')
                            ->orWhere('end_date', '>=', $periodStart);
                    })
                    ->orderBy('start_date', 'desc');
            }])
            ->with(['deductions' => function ($query) use ($calculationMonth, $year) {
                $query->where('pay_period_month', $calculationMonth)
                    ->where('pay_period_year', $year)
                    ->with('deductionType');
            }])
            ->orderBy('last_name', 'asc')
            ->paginate(50)
            ->withQueryString();

        $employees->getCollection()->transform(function ($employee) use ($calculationMonth, $year) {
            $payroll = $this->payrollService->calculatePayroll($employee, $year, $calculationMonth);

            $employee->current_salary = $payroll['salary'];
            $employee->current_pera = $payroll['pera'];
            $employee->current_rata = $payroll['rata'];
            $employee->current_hazard_pay = $payroll['hazard_pay'];
            $employee->current_clothing_allowance = $payroll['clothing_allowance'];
            $employee->total_deductions = $payroll['total_deductions'];
            $employee->gross_pay = $payroll['gross_pay'];
            $employee->net_pay = $payroll['net_pay'];

            return $employee;
        });

        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();

        return Inertia::render('payroll/index', [
            'employees' => $employees,
            'offices' => $offices,
            'employmentStatuses' => $employmentStatuses,
            'filters' => [
                'month' => (int) $month,
                'year' => (int) $year,
                'office_id' => $officeId,
                'employment_status_id' => $employmentStatusId,
                'search' => $search,
            ],
            'can' => [
                'export' => Gate::allows('payroll.export'),
            ],
        ]);
    }

    public function show(Request $request, Employee $employee): Response
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        $employee->load(['employmentStatus', 'office']);

        $salaryHistory = $employee->salaries()
            ->orderBy('effective_date', 'desc')
            ->get();

        $peraHistory = $employee->peras()
            ->orderBy('effective_date', 'desc')
            ->get();

        $rataHistory = $employee->ratas()
            ->orderBy('effective_date', 'desc')
            ->get();

        $deductions = $employee->deductions()
            ->where('pay_period_month', $month)
            ->where('pay_period_year', $year)
            ->with('deductionType')
            ->get();

        return Inertia::render('payroll/show', [
            'employee' => $employee,
            'salaryHistory' => $salaryHistory,
            'peraHistory' => $peraHistory,
            'rataHistory' => $rataHistory,
            'deductions' => $deductions,
            'filters' => [
                'month' => (int) $month,
                'year' => (int) $year,
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        $officeId = $request->input('office_id');
        $search = $request->input('search');
        $employmentStatusId = $request->input('employment_status_id');

        $periodEnd = now()->setDate($year, $month, 1)->endOfMonth();

        $filename = "payroll_{$year}_{$month}.csv";
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$filename}",
        ];

        return new StreamedResponse(function () use ($month, $year, $officeId, $search, $employmentStatusId, $periodEnd) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Payroll Summary']);
            fputcsv($handle, ['Period:', date('F Y', mktime(0, 0, 0, $month, 1, $year))]);
            fputcsv($handle, ['Generated:', now()->format('Y-m-d H:i:s')]);
            fputcsv($handle, []);

            fputcsv($handle, [
                'Employee Name',
                'Position',
                'Office',
                'Employment Status',
                'Salary',
                'PERA',
                'RATA',
                'Gross Pay',
                'Deductions',
                'Net Pay',
            ]);

            $totalSalary = 0;
            $totalPera = 0;
            $totalRata = 0;
            $totalGross = 0;
            $totalDeductions = 0;
            $totalNet = 0;

            $query = Employee::query()
                ->with(['employmentStatus', 'office'])
                ->when($search, function ($query, $search) {
                    $query->where('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                })
                ->when($officeId, function ($query, $officeId) {
                    $query->where('office_id', $officeId);
                })
                ->when($employmentStatusId, function ($query, $employmentStatusId) {
                    $query->where('employment_status_id', $employmentStatusId);
                })
                ->with(['salaries' => function ($query) use ($periodEnd) {
                    $query->where('effective_date', '<=', $periodEnd)
                        ->orderBy('effective_date', 'desc');
                }])
                ->with(['peras' => function ($query) use ($periodEnd) {
                    $query->where('effective_date', '<=', $periodEnd)
                        ->orderBy('effective_date', 'desc');
                }])
                ->with(['ratas' => function ($query) use ($periodEnd) {
                    $query->where('effective_date', '<=', $periodEnd)
                        ->orderBy('effective_date', 'desc');
                }])
                ->with(['hazardPays' => function ($query) use ($month, $year) {
                    $periodEnd = now()->setDate($year, $month, 1)->endOfMonth();
                    $periodStart = now()->setDate($year, $month, 1)->startOfMonth();
                    $query->where('start_date', '<=', $periodEnd)
                        ->where(function ($q) use ($periodEnd, $periodStart) {
                            $q->whereNull('end_date')
                                ->orWhere('end_date', '>=', $periodStart);
                        })
                        ->orderBy('start_date', 'desc');
                }])
                ->with(['clothingAllowances' => function ($query) use ($month, $year) {
                    $periodEnd = now()->setDate($year, $month, 1)->endOfMonth();
                    $periodStart = now()->setDate($year, $month, 1)->startOfMonth();
                    $query->where('start_date', '<=', $periodEnd)
                        ->where(function ($q) use ($periodEnd, $periodStart) {
                            $q->whereNull('end_date')
                                ->orWhere('end_date', '>=', $periodStart);
                        })
                        ->orderBy('start_date', 'desc');
                }])
                ->with(['deductions' => function ($query) use ($month, $year) {
                    $query->where('pay_period_month', $month)
                        ->where('pay_period_year', $year);
                }])
                ->orderBy('last_name', 'asc');

            $query->chunk(200, function ($employees) use (
                &$handle,
                $month,
                $year,
                &$totalSalary,
                &$totalPera,
                &$totalRata,
                &$totalGross,
                &$totalDeductions,
                &$totalNet
            ) {
                foreach ($employees as $employee) {
                    $payroll = $this->payrollService->calculatePayroll($employee, $year, $month);

                    fputcsv($handle, [
                        $employee->last_name . ', ' . $employee->first_name . ' ' . $employee->middle_name,
                        $employee->position,
                        $employee->office?->name ?? 'N/A',
                        $employee->employmentStatus?->name ?? 'N/A',
                        number_format($payroll['salary'], 2),
                        number_format($payroll['pera'], 2),
                        number_format($payroll['rata'], 2),
                        number_format($payroll['gross_pay'], 2),
                        number_format($payroll['total_deductions'], 2),
                        number_format($payroll['net_pay'], 2),
                    ]);

                    $totalSalary += $payroll['salary'];
                    $totalPera += $payroll['pera'];
                    $totalRata += $payroll['rata'];
                    $totalGross += $payroll['gross_pay'];
                    $totalDeductions += $payroll['total_deductions'];
                    $totalNet += $payroll['net_pay'];
                }
            });

            fputcsv($handle, []);
            fputcsv($handle, [
                'TOTALS',
                '',
                '',
                '',
                number_format($totalSalary, 2),
                number_format($totalPera, 2),
                number_format($totalRata, 2),
                number_format($totalGross, 2),
                number_format($totalDeductions, 2),
                number_format($totalNet, 2),
            ]);

            fclose($handle);
        }, 200, $headers);
    }

    public function print(Request $request): Response
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month');
        $officeId = $request->input('office_id');
        $employeeId = $request->input('employee_id');

        $employees = Employee::query()
            ->with(['employmentStatus', 'office'])
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($employeeId, function ($query, $employeeId) {
                $query->where('id', $employeeId);
            })
            ->orderBy('last_name', 'asc')
            ->get();

        $officeName = null;
        if ($officeId) {
            $officeName = Office::find($officeId)?->name;
        }

        $monthlyData = [];
        $monthsToProcess = ($month && $month != 0) ? [$month] : range(1, 12);

        foreach ($monthsToProcess as $monthNum) {
            $monthEmployees = [];
            $totals = [
                'salary' => 0,
                'pera' => 0,
                'rata' => 0,
                'hazard_pay' => 0,
                'clothing_allowance' => 0,
                'gross_pay' => 0,
                'deductions' => 0,
                'net_pay' => 0,
            ];

            foreach ($employees as $employee) {
                $salary = $this->payrollService->getEffectiveAmount($employee->salaries, $year, $monthNum);
                $pera = $this->payrollService->getEffectiveAmount($employee->peras, $year, $monthNum);
                $rata = $employee->is_rata_eligible ? $this->payrollService->getEffectiveAmount($employee->ratas, $year, $monthNum) : 0;
                // Use date range logic for hazard pay and clothing allowance
                $hazardPay = $this->payrollService->getEffectiveAmountForDateRange($employee->hazardPays, $year, $monthNum);
                $clothingAllowance = $this->payrollService->getEffectiveAmountForDateRange($employee->clothingAllowances, $year, $monthNum);
                $deductions = $employee->deductions()
                    ->where('pay_period_month', $monthNum)
                    ->where('pay_period_year', $year)
                    ->sum('amount');

                $grossPay = $salary + $pera + $rata + $hazardPay + $clothingAllowance;
                $netPay = $grossPay - $deductions;

                if ($salary > 0 || $pera > 0 || $rata > 0 || $hazardPay > 0 || $clothingAllowance > 0 || $deductions > 0) {
                    $monthEmployees[] = [
                        'id' => $employee->id,
                        'name' => $employee->last_name . ', ' . $employee->first_name . ' ' . $employee->middle_name,
                        'position' => $employee->position,
                        'office' => $employee->office?->name ?? 'N/A',
                        'salary' => $salary,
                        'pera' => $pera,
                        'rata' => $rata,
                        'hazard_pay' => $hazardPay,
                        'clothing_allowance' => $clothingAllowance,
                        'gross_pay' => $grossPay,
                        'deductions' => $deductions,
                        'net_pay' => $netPay,
                    ];

                    $totals['salary'] += $salary;
                    $totals['pera'] += $pera;
                    $totals['rata'] += $rata;
                    $totals['hazard_pay'] += $hazardPay;
                    $totals['clothing_allowance'] += $clothingAllowance;
                    $totals['gross_pay'] += $grossPay;
                    $totals['deductions'] += $deductions;
                    $totals['net_pay'] += $netPay;
                }
            }

            $monthlyData[] = [
                'month' => $monthNum,
                'year' => $year,
                'employees' => $monthEmployees,
                'totals' => $totals,
            ];
        }

        return Inertia::render('payroll/print', [
            'year' => (int) $year,
            'monthlyData' => $monthlyData,
            'office' => $officeName,
        ]);
    }

    public function comparison(Request $request): Response
    {
        $period1Month = $request->input('period1_month', now()->month);
        $period1Year = $request->input('period1_year', now()->year);
        $period2Month = $request->input('period2_month', now()->subMonth()->month);
        $period2Year = $request->input('period2_year', now()->subMonth()->year);
        $officeId = $request->input('office_id');
        $search = $request->input('search');
        $employmentStatusId = $request->input('employment_status_id');

        $period1End = now()->setDate($period1Year, $period1Month, 1)->endOfMonth();
        $period2End = now()->setDate($period2Year, $period2Month, 1)->endOfMonth();

        $employees = Employee::query()
            ->with(['employmentStatus', 'office'])
            ->when($search, function ($query, $search) {
                $query->where('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            })
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($employmentStatusId, function ($query, $employmentStatusId) {
                $query->where('employment_status_id', $employmentStatusId);
            })
            ->with(['salaries' => function ($query) use ($period1End, $period2End) {
                $query->where('effective_date', '<=', max($period1End, $period2End))
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['peras' => function ($query) use ($period1End, $period2End) {
                $query->where('effective_date', '<=', max($period1End, $period2End))
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['ratas' => function ($query) use ($period1End, $period2End) {
                $query->where('effective_date', '<=', max($period1End, $period2End))
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['deductions' => function ($query) use ($period1Month, $period1Year, $period2Month, $period2Year) {
                $query->where(function ($q) use ($period1Month, $period1Year) {
                    $q->where('pay_period_month', $period1Month)
                        ->where('pay_period_year', $period1Year);
                })->orWhere(function ($q) use ($period2Month, $period2Year) {
                    $q->where('pay_period_month', $period2Month)
                        ->where('pay_period_year', $period2Year);
                });
            }])
            ->orderBy('last_name', 'asc')
            ->get();

        $employees->transform(function ($employee) use ($period1Month, $period1Year, $period2Month, $period2Year) {
            $salary1 = $this->payrollService->getEffectiveAmount($employee->salaries, $period1Year, $period1Month);
            $pera1 = $this->payrollService->getEffectiveAmount($employee->peras, $period1Year, $period1Month);
            $rata1 = $employee->is_rata_eligible ? $this->payrollService->getEffectiveAmount($employee->ratas, $period1Year, $period1Month) : 0;

            $deductions1 = $employee->deductions
                ->where('pay_period_month', $period1Month)
                ->where('pay_period_year', $period1Year)
                ->sum('amount');

            $grossPay1 = $salary1 + $pera1 + $rata1;
            $netPay1 = $grossPay1 - $deductions1;

            $salary2 = $this->payrollService->getEffectiveAmount($employee->salaries, $period2Year, $period2Month);
            $pera2 = $this->payrollService->getEffectiveAmount($employee->peras, $period2Year, $period2Month);
            $rata2 = $employee->is_rata_eligible ? $this->payrollService->getEffectiveAmount($employee->ratas, $period2Year, $period2Month) : 0;

            $deductions2 = $employee->deductions
                ->where('pay_period_month', $period2Month)
                ->where('pay_period_year', $period2Year)
                ->sum('amount');

            $grossPay2 = $salary2 + $pera2 + $rata2;
            $netPay2 = $grossPay2 - $deductions2;

            return [
                'id' => $employee->id,
                'name' => $employee->last_name . ', ' . $employee->first_name . ' ' . $employee->middle_name,
                'position' => $employee->position,
                'office' => $employee->office?->name ?? 'N/A',
                'employment_status' => $employee->employmentStatus?->name ?? 'N/A',
                'is_rata_eligible' => $employee->is_rata_eligible,
                'period1' => [
                    'month' => $period1Month,
                    'year' => $period1Year,
                    'salary' => $salary1,
                    'pera' => $pera1,
                    'rata' => $rata1,
                    'gross_pay' => $grossPay1,
                    'deductions' => $deductions1,
                    'net_pay' => $netPay1,
                ],
                'period2' => [
                    'month' => $period2Month,
                    'year' => $period2Year,
                    'salary' => $salary2,
                    'pera' => $pera2,
                    'rata' => $rata2,
                    'gross_pay' => $grossPay2,
                    'deductions' => $deductions2,
                    'net_pay' => $netPay2,
                ],
                'differences' => [
                    'salary' => $salary1 - $salary2,
                    'pera' => $pera1 - $pera2,
                    'rata' => $rata1 - $rata2,
                    'gross_pay' => $grossPay1 - $grossPay2,
                    'deductions' => $deductions1 - $deductions2,
                    'net_pay' => $netPay1 - $netPay2,
                ],
            ];
        });

        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();

        return Inertia::render('payroll/comparison', [
            'employees' => $employees,
            'offices' => $offices,
            'employmentStatuses' => $employmentStatuses,
            'filters' => [
                'period1_month' => (int) $period1Month,
                'period1_year' => (int) $period1Year,
                'period2_month' => (int) $period2Month,
                'period2_year' => (int) $period2Year,
                'office_id' => $officeId,
                'employment_status_id' => $employmentStatusId,
                'search' => $search,
            ],
        ]);
    }
}
