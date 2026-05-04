<?php

namespace App\Http\Controllers;

use App\Models\DeductionType;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use App\Models\EmploymentStatus;
use App\Models\Office;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MayDeductionsController extends Controller
{
    public function index(Request $request)
    {
        $filterMonth = $request->input('month');
        $filterYear = (int) $request->input('year', now()->year);

        $deductionTypesQuery = DeductionType::query()->where('is_active', true);

        $deductionTypes = $deductionTypesQuery->withCount([
            'employeeDeductions as deduction_count' => function ($query) use ($filterMonth, $filterYear) {
                if ($filterMonth) {
                    $query->where('pay_period_month', (int) $filterMonth)
                        ->where('pay_period_year', $filterYear);
                } else {
                    $query->where('pay_period_year', $filterYear);
                }
            },
        ])->withSum([
            'employeeDeductions as total_amount' => function ($query) use ($filterMonth, $filterYear) {
                if ($filterMonth) {
                    $query->where('pay_period_month', (int) $filterMonth)
                        ->where('pay_period_year', $filterYear);
                } else {
                    $query->where('pay_period_year', $filterYear);
                }
            },
        ], 'amount')->get()->map(function ($type) {
            return [
                'id' => $type->id,
                'name' => $type->name,
                'code' => $type->code,
                'deduction_count' => $type->deduction_count ?? 0,
                'total_amount' => $type->total_amount ?? 0,
            ];
        })->filter(function ($type) {
            return $type['deduction_count'] > 0;
        })->sortByDesc('total_amount')->values();

        $summary = [
            'total_deduction_types' => $deductionTypes->count(),
            'total_deductions' => $deductionTypes->sum('deduction_count'),
            'total_amount' => $deductionTypes->sum('total_amount'),
        ];

        return Inertia::render('MayDeductions/Index', [
            'deductionTypes' => $deductionTypes,
            'summary' => $summary,
            'filters' => [
                'month' => $filterMonth,
                'year' => $filterYear,
            ],
        ]);
    }

    public function employees(Request $request, DeductionType $deductionType)
    {
        $filterMonth = $request->input('month');
        $filterYear = (int) $request->input('year', now()->year);
        $filterOffice = $request->input('office_id');
        $filterEmploymentStatus = $request->input('employment_status_id');
        $filterSearch = $request->input('search');

        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();

        $employeesQuery = Employee::query()
            ->with(['office', 'employmentStatus'])
            ->whereHas('employeeDeductions', function ($query) use ($deductionType, $filterMonth, $filterYear) {
                $query->where('deduction_type_id', $deductionType->id);
                if ($filterMonth) {
                    $query->where('pay_period_month', (int) $filterMonth)
                        ->where('pay_period_year', $filterYear);
                } else {
                    $query->where('pay_period_year', $filterYear);
                }
            });

        if ($filterOffice) {
            $employeesQuery->where('office_id', (int) $filterOffice);
        }

        if ($filterEmploymentStatus) {
            $employeesQuery->where('employment_status_id', (int) $filterEmploymentStatus);
        }

        if ($filterSearch) {
            $employeesQuery->where(function ($query) use ($filterSearch) {
                $query->whereRaw("CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) LIKE ?", ["%{$filterSearch}%"])
                    ->orWhere('last_name', 'LIKE', "%{$filterSearch}%")
                    ->orWhere('first_name', 'LIKE', "%{$filterSearch}%");
            });
        }

        $employees = $employeesQuery->paginate(20)->withQueryString();

        $employeesWithDeductions = collect($employees->items())->map(function ($employee) use ($deductionType, $filterMonth, $filterYear) {
            $deductionsQuery = $employee->employeeDeductions()
                ->where('deduction_type_id', $deductionType->id);

            if ($filterMonth) {
                $deductionsQuery->where('pay_period_month', (int) $filterMonth)
                    ->where('pay_period_year', $filterYear);
            } else {
                $deductionsQuery->where('pay_period_year', $filterYear);
            }

            $deductions = $deductionsQuery->get();

            return [
                'id' => $employee->id,
                'employee_id' => $employee->id,
                'employee_name' => $employee->last_name . ', ' . $employee->first_name . ' ' . ($employee->middle_name ?? ''),
                'position' => $employee->position,
                'office' => $employee->office?->name ?? 'N/A',
                'employment_status' => $employee->employmentStatus?->name ?? 'N/A',
                'deduction_count' => $deductions->count(),
                'total_amount' => $deductions->sum('amount'),
            ];
        })->filter(function ($employee) {
            return $employee['deduction_count'] > 0;
        })->sortByDesc('total_amount')->values();

        $summary = [
            'total_employees' => $employees->total(),
            'total_deductions' => $employeesWithDeductions->sum('deduction_count'),
            'total_amount' => $employeesWithDeductions->sum('total_amount'),
        ];

        return Inertia::render('MayDeductions/EmployeesByType', [
            'deduction_type' => [
                'id' => $deductionType->id,
                'name' => $deductionType->name,
                'code' => $deductionType->code,
            ],
            'employees' => $employeesWithDeductions,
            'employees_paginated' => $employees,
            'summary' => $summary,
            'offices' => $offices,
            'employment_statuses' => $employmentStatuses,
            'filters' => [
                'month' => $filterMonth,
                'year' => $filterYear,
                'office_id' => $filterOffice,
                'employment_status_id' => $filterEmploymentStatus,
                'search' => $filterSearch,
            ],
        ]);
    }

    public function print(Request $request)
    {
        $filterMonth = $request->input('month');
        $filterYear = (int) $request->input('year', now()->year);

        $deductionTypes = DeductionType::query()->where('is_active', true)
            ->withCount([
                'employeeDeductions as deduction_count' => function ($query) use ($filterMonth, $filterYear) {
                    if ($filterMonth) {
                        $query->where('pay_period_month', (int) $filterMonth)
                            ->where('pay_period_year', $filterYear);
                    } else {
                        $query->where('pay_period_year', $filterYear);
                    }
                },
            ])->withSum([
                'employeeDeductions as total_amount' => function ($query) use ($filterMonth, $filterYear) {
                    if ($filterMonth) {
                        $query->where('pay_period_month', (int) $filterMonth)
                            ->where('pay_period_year', $filterYear);
                    } else {
                        $query->where('pay_period_year', $filterYear);
                    }
                },
            ], 'amount')->get()->map(function ($type) {
                return [
                    'id' => $type->id,
                    'name' => $type->name,
                    'code' => $type->code,
                    'deduction_count' => $type->deduction_count ?? 0,
                    'total_amount' => $type->total_amount ?? 0,
                ];
            })->filter(function ($type) {
                return $type['deduction_count'] > 0;
            })->sortByDesc('total_amount')->values();

        $summary = [
            'total_deduction_types' => $deductionTypes->count(),
            'total_deductions' => $deductionTypes->sum('deduction_count'),
            'total_amount' => $deductionTypes->sum('total_amount'),
        ];

        return Inertia::render('MayDeductions/Print', [
            'deductionTypes' => $deductionTypes,
            'summary' => $summary,
            'filters' => [
                'month' => $filterMonth,
                'year' => $filterYear,
            ],
        ]);
    }

    public function employeesPrint(Request $request, DeductionType $deductionType)
    {
        $filterMonth = $request->input('month');
        $filterYear = (int) $request->input('year', now()->year);
        $filterOffice = $request->input('office_id');
        $filterEmploymentStatus = $request->input('employment_status_id');
        $filterSearch = $request->input('search');

        $employeesQuery = Employee::query()
            ->with(['office', 'employmentStatus'])
            ->whereHas('employeeDeductions', function ($query) use ($deductionType, $filterMonth, $filterYear) {
                $query->where('deduction_type_id', $deductionType->id);
                if ($filterMonth) {
                    $query->where('pay_period_month', (int) $filterMonth)
                        ->where('pay_period_year', $filterYear);
                } else {
                    $query->where('pay_period_year', $filterYear);
                }
            });

        if ($filterOffice) {
            $employeesQuery->where('office_id', (int) $filterOffice);
        }

        if ($filterEmploymentStatus) {
            $employeesQuery->where('employment_status_id', (int) $filterEmploymentStatus);
        }

        if ($filterSearch) {
            $employeesQuery->where(function ($query) use ($filterSearch) {
                $query->whereRaw("CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) LIKE ?", ["%{$filterSearch}%"])
                    ->orWhere('last_name', 'LIKE', "%{$filterSearch}%")
                    ->orWhere('first_name', 'LIKE', "%{$filterSearch}%");
            });
        }

        $employees = $employeesQuery->get()->map(function ($employee) use ($deductionType, $filterMonth, $filterYear) {
            $deductionsQuery = $employee->employeeDeductions()
                ->where('deduction_type_id', $deductionType->id);

            if ($filterMonth) {
                $deductionsQuery->where('pay_period_month', (int) $filterMonth)
                    ->where('pay_period_year', $filterYear);
            } else {
                $deductionsQuery->where('pay_period_year', $filterYear);
            }

            $deductions = $deductionsQuery->get();

            return [
                'id' => $employee->id,
                'employee_id' => $employee->id,
                'employee_name' => $employee->last_name . ', ' . $employee->first_name . ' ' . ($employee->middle_name ?? ''),
                'position' => $employee->position,
                'office' => $employee->office?->name ?? 'N/A',
                'employment_status' => $employee->employmentStatus?->name ?? 'N/A',
                'deduction_count' => $deductions->count(),
                'total_amount' => $deductions->sum('amount'),
            ];
        })->filter(function ($employee) {
            return $employee['deduction_count'] > 0;
        })->sortByDesc('total_amount')->values();

        $summary = [
            'total_employees' => $employees->count(),
            'total_deductions' => $employees->sum('deduction_count'),
            'total_amount' => $employees->sum('total_amount'),
        ];

        return Inertia::render('MayDeductions/EmployeesByTypePrint', [
            'deduction_type' => [
                'id' => $deductionType->id,
                'name' => $deductionType->name,
                'code' => $deductionType->code,
            ],
            'employees' => $employees,
            'summary' => $summary,
            'filters' => [
                'month' => $filterMonth,
                'year' => $filterYear,
                'office_id' => $filterOffice,
                'employment_status_id' => $filterEmploymentStatus,
                'search' => $filterSearch,
            ],
        ]);
    }
}