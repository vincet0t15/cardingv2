<?php

namespace App\Http\Controllers;

use App\Models\EmployeeDeduction;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EmployeeDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $employee = $user->employee;

        if (! $employee) {
            return Inertia::render('EmployeeDashboard/Unlinked', [
                'message' => 'Your account is not linked to any employee record. Please contact your administrator.',
            ]);
        }

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

        $deductions = EmployeeDeduction::where('employee_id', $employee->id)
            ->with('deductionType')
            ->orderBy('pay_period_year', 'desc')
            ->orderBy('pay_period_month', 'desc')
            ->limit(50)
            ->get();

        $groupedDeductions = $deductions->groupBy(function ($d) {
            return $d->pay_period_year.'-'.str_pad($d->pay_period_month, 2, '0', STR_PAD_LEFT);
        })->map(function ($group) {
            return $group->toArray();
        })->toArray();

        $totalDeductions = (float) $deductions->sum('amount');

        return Inertia::render('EmployeeDashboard/Index', [
            'employee' => $employee,
            'groupedDeductions' => $groupedDeductions,
            'totalDeductions' => $totalDeductions,
        ]);
    }
}
