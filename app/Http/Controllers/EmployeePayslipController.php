<?php

namespace App\Http\Controllers;

use App\Models\DeductionType;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use App\Services\PayrollService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EmployeePayslipController extends Controller
{
    protected PayrollService $payrollService;

    public function __construct(PayrollService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    /**
     * Show the payslip page for a given period.
     */
    public function show(Request $request)
    {
        $employee = Auth::user()->employee;

        if (!$employee) {
            return redirect()->route('employee.dashboard')->with('error', 'No linked employee record found.');
        }

        $month = $request->input('month', now()->month);
        $year  = $request->input('year', now()->year);

        $payrollData = $this->payrollService->calculatePayroll($employee, (int) $year, (int) $month);

        return inertia('EmployeeDashboard/Payslip', [
            'employee'   => $employee->load('office', 'employmentStatus'),
            'month'      => (int) $month,
            'year'       => (int) $year,
            'payroll'    => $this->formatPayrollData($employee, $payrollData, (int) $year, (int) $month),
            'periods'    => $this->getAvailablePeriods($employee),
        ]);
    }

    /**
     * Download payslip as PDF.
     */
    public function downloadPdf(Request $request)
    {
        $employee = Auth::user()->employee;

        if (!$employee) {
            return redirect()->route('employee.dashboard')->with('error', 'No linked employee record found.');
        }

        $month = $request->input('month', now()->month);
        $year  = $request->input('year', now()->year);

        $payrollData = $this->payrollService->calculatePayroll($employee, (int) $year, (int) $month);

        $monthName = Carbon::create($year, $month, 1)->format('F Y');

        $pdf = Pdf::loadView('pdf.payslip', [
            'employee'   => $employee->load('office', 'employmentStatus'),
            'month'      => (int) $month,
            'year'       => (int) $year,
            'monthName'  => $monthName,
            'payroll'    => $this->formatPayrollData($employee, $payrollData, (int) $year, (int) $month),
        ]);

        $filename = 'Payslip_' . $employee->last_name . '_' . $monthName . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Format flat payroll data into the nested structure expected by the frontend and PDF template.
     */
    protected function formatPayrollData(Employee $employee, array $raw, int $year, int $month): array
    {
        // Fetch itemized deductions for this period with their deduction types
        $deductionRecords = EmployeeDeduction::where('employee_id', $employee->id)
            ->where('pay_period_year', $year)
            ->where('pay_period_month', $month)
            ->with('deductionType')
            ->get();

        // Categorize deductions by contribution code
        $sss = 0;
        $philhealth = 0;
        $pagibig = 0;
        $withholdingTax = 0;
        $otherItems = [];

        foreach ($deductionRecords as $ded) {
            $code = $ded->deductionType?->contribution_code;
            $amount = (float) $ded->amount;

            switch ($code) {
                case DeductionType::CONTRIB_SSS:
                    $sss += $amount;
                    break;
                case DeductionType::CONTRIB_PHILHEALTH:
                    $philhealth += $amount;
                    break;
                case DeductionType::CONTRIB_PAGIBIG:
                    $pagibig += $amount;
                    break;
                case DeductionType::CONTRIB_TAX:
                    $withholdingTax += $amount;
                    break;
                default:
                    $otherItems[] = [
                        'name' => $ded->deductionType?->name ?? 'Other Deduction',
                        'amount' => $amount,
                        'type' => $code ?? 'OTHER',
                    ];
                    break;
            }
        }

        return [
            'earnings' => [
                'basic_salary'       => $raw['salary'] ?? 0,
                'pera'               => $raw['pera'] ?? 0,
                'rata'               => $raw['rata'] ?? 0,
                'hazard_pay'         => $raw['hazard_pay'] ?? 0,
                'clothing_allowance' => $raw['clothing_allowance'] ?? 0,
                'total_claims'       => 0,
                'adjustments'        => $raw['adjustments'] ?? 0,
            ],
            'deductions' => [
                'sss'             => $sss,
                'philhealth'      => $philhealth,
                'pagibig'         => $pagibig,
                'withholding_tax' => $withholdingTax,
                'items'           => $otherItems,
            ],
            'summary' => [
                'gross_pay'         => $raw['gross_pay'] ?? 0,
                'total_deductions'  => $raw['total_deductions'] ?? 0,
                'net_pay'           => $raw['net_pay'] ?? 0,
                'working_days'      => null,
                'remarks'           => null,
            ],
        ];
    }

    /**
     * Get available payroll periods for the employee.
     */
    protected function getAvailablePeriods(Employee $employee): array
    {
        // Fetch distinct year+month combinations where this employee has salary data
        $periods = $employee->salaries()
            ->selectRaw('YEAR(effective_date) as year, MONTH(effective_date) as month')
            ->distinct()
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get()
            ->toArray();

        // Always include current period
        $currentPeriod = ['year' => (int) now()->year, 'month' => (int) now()->month];
        $allPeriods = collect($periods)->push($currentPeriod)->unique(function ($p) {
            return $p['year'] . '-' . $p['month'];
        })->sortByDesc(function ($p) {
            return $p['year'] * 100 + $p['month'];
        })->values()->toArray();

        return $allPeriods;
    }
}
