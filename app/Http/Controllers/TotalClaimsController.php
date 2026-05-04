<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\ClaimType;
use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\Office;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TotalClaimsController extends Controller
{
    public function index(Request $request)
    {
        $filterMonth = $request->input('month');
        $filterYear = $request->input('year', now()->year);

        $claimTypesQuery = ClaimType::query()->where('is_active', true);

        $claimTypes = $claimTypesQuery->withCount([
            'claims as claim_count' => function ($query) use ($filterMonth, $filterYear) {
                if ($filterMonth) {
                    $query->whereMonth('claim_date', $filterMonth)
                        ->whereYear('claim_date', $filterYear);
                } else {
                    $query->whereYear('claim_date', $filterYear);
                }
            },
        ])->withSum([
            'claims as total_amount' => function ($query) use ($filterMonth, $filterYear) {
                if ($filterMonth) {
                    $query->whereMonth('claim_date', $filterMonth)
                        ->whereYear('claim_date', $filterYear);
                } else {
                    $query->whereYear('claim_date', $filterYear);
                }
            },
        ], 'amount')->get()->map(function ($type) {
            return [
                'id' => $type->id,
                'name' => $type->name,
                'code' => $type->code,
                'claim_count' => $type->claim_count ?? 0,
                'total_amount' => $type->total_amount ?? 0,
            ];
        })->filter(function ($type) {
            return $type['claim_count'] > 0;
        })->sortByDesc('total_amount')->values();

        $summary = [
            'total_claim_types' => $claimTypes->count(),
            'total_claims' => $claimTypes->sum('claim_count'),
            'total_amount' => $claimTypes->sum('total_amount'),
        ];

        return Inertia::render('TotalClaims/Index', [
            'claimTypes' => $claimTypes,
            'summary' => $summary,
            'filters' => [
                'month' => $filterMonth,
                'year' => $filterYear,
            ],
        ]);
    }

    public function employees(Request $request, ClaimType $claimType)
    {
        $filterMonth = $request->input('month');
        $filterYear = $request->input('year', now()->year);
        $filterOffice = $request->input('office_id');
        $filterEmploymentStatus = $request->input('employment_status_id');
        $filterSearch = $request->input('search');

        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();

        $employeesQuery = Employee::query()
            ->with(['office', 'employmentStatus'])
            ->whereHas('claims', function ($query) use ($claimType, $filterMonth, $filterYear) {
                $query->where('claim_type_id', $claimType->id);
                if ($filterMonth) {
                    $query->whereMonth('claim_date', $filterMonth)
                        ->whereYear('claim_date', $filterYear);
                } else {
                    $query->whereYear('claim_date', $filterYear);
                }
            });

        if ($filterOffice) {
            $employeesQuery->where('office_id', $filterOffice);
        }

        if ($filterEmploymentStatus) {
            $employeesQuery->where('employment_status_id', $filterEmploymentStatus);
        }

        if ($filterSearch) {
            $employeesQuery->where(function ($query) use ($filterSearch) {
                $query->whereRaw("CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) LIKE ?", ["%{$filterSearch}%"])
                    ->orWhere('last_name', 'LIKE', "%{$filterSearch}%")
                    ->orWhere('first_name', 'LIKE', "%{$filterSearch}%");
            });
        }

        $employees = $employeesQuery->paginate(20)->withQueryString();

        $employeesWithClaims = collect($employees->items())->map(function ($employee) use ($claimType, $filterMonth, $filterYear) {
            $claimsQuery = $employee->claims()
                ->where('claim_type_id', $claimType->id);

            if ($filterMonth) {
                $claimsQuery->whereMonth('claim_date', $filterMonth)
                    ->whereYear('claim_date', $filterYear);
            } else {
                $claimsQuery->whereYear('claim_date', $filterYear);
            }

            $claims = $claimsQuery->get();

            return [
                'id' => $employee->id,
                'employee_id' => $employee->id,
                'employee_name' => $employee->last_name . ', ' . $employee->first_name . ' ' . ($employee->middle_name ?? ''),
                'position' => $employee->position,
                'office' => $employee->office?->name ?? 'N/A',
                'employment_status' => $employee->employmentStatus?->name ?? 'N/A',
                'claim_count' => $claims->count(),
                'total_amount' => $claims->sum('amount'),
            ];
        })->filter(function ($employee) {
            return $employee['claim_count'] > 0;
        })->sortByDesc('total_amount')->values();

        $summary = [
            'total_employees' => $employees->total(),
            'total_claims' => $employeesWithClaims->sum('claim_count'),
            'total_amount' => $employeesWithClaims->sum('total_amount'),
        ];

        return Inertia::render('TotalClaims/EmployeesByType', [
            'claim_type' => [
                'id' => $claimType->id,
                'name' => $claimType->name,
                'code' => $claimType->code,
            ],
            'employees' => $employeesWithClaims,
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
        $filterYear = $request->input('year', now()->year);

        $claimTypes = ClaimType::query()->where('is_active', true)
            ->withCount([
                'claims as claim_count' => function ($query) use ($filterMonth, $filterYear) {
                    if ($filterMonth) {
                        $query->whereMonth('claim_date', $filterMonth)
                            ->whereYear('claim_date', $filterYear);
                    } else {
                        $query->whereYear('claim_date', $filterYear);
                    }
                },
            ])->withSum([
                'claims as total_amount' => function ($query) use ($filterMonth, $filterYear) {
                    if ($filterMonth) {
                        $query->whereMonth('claim_date', $filterMonth)
                            ->whereYear('claim_date', $filterYear);
                    } else {
                        $query->whereYear('claim_date', $filterYear);
                    }
                },
            ], 'amount')->get()->map(function ($type) {
                return [
                    'id' => $type->id,
                    'name' => $type->name,
                    'code' => $type->code,
                    'claim_count' => $type->claim_count ?? 0,
                    'total_amount' => $type->total_amount ?? 0,
                ];
            })->filter(function ($type) {
                return $type['claim_count'] > 0;
            })->sortByDesc('total_amount')->values();

        $summary = [
            'total_claim_types' => $claimTypes->count(),
            'total_claims' => $claimTypes->sum('claim_count'),
            'total_amount' => $claimTypes->sum('total_amount'),
        ];

        return Inertia::render('TotalClaims/Print', [
            'claimTypes' => $claimTypes,
            'summary' => $summary,
            'filters' => [
                'month' => $filterMonth,
                'year' => $filterYear,
            ],
        ]);
    }

    public function employeesPrint(Request $request, ClaimType $claimType)
    {
        $filterMonth = $request->input('month');
        $filterYear = $request->input('year', now()->year);
        $filterOffice = $request->input('office_id');
        $filterEmploymentStatus = $request->input('employment_status_id');
        $filterSearch = $request->input('search');

        $employeesQuery = Employee::query()
            ->with(['office', 'employmentStatus'])
            ->whereHas('claims', function ($query) use ($claimType, $filterMonth, $filterYear) {
                $query->where('claim_type_id', $claimType->id);
                if ($filterMonth) {
                    $query->whereMonth('claim_date', $filterMonth)
                        ->whereYear('claim_date', $filterYear);
                } else {
                    $query->whereYear('claim_date', $filterYear);
                }
            });

        if ($filterOffice) {
            $employeesQuery->where('office_id', $filterOffice);
        }

        if ($filterEmploymentStatus) {
            $employeesQuery->where('employment_status_id', $filterEmploymentStatus);
        }

        if ($filterSearch) {
            $employeesQuery->where(function ($query) use ($filterSearch) {
                $query->whereRaw("CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) LIKE ?", ["%{$filterSearch}%"])
                    ->orWhere('last_name', 'LIKE', "%{$filterSearch}%")
                    ->orWhere('first_name', 'LIKE', "%{$filterSearch}%");
            });
        }

        $employees = $employeesQuery->get()->map(function ($employee) use ($claimType, $filterMonth, $filterYear) {
            $claimsQuery = $employee->claims()
                ->where('claim_type_id', $claimType->id);

            if ($filterMonth) {
                $claimsQuery->whereMonth('claim_date', $filterMonth)
                    ->whereYear('claim_date', $filterYear);
            } else {
                $claimsQuery->whereYear('claim_date', $filterYear);
            }

            $claims = $claimsQuery->get();

            return [
                'id' => $employee->id,
                'employee_id' => $employee->id,
                'employee_name' => $employee->last_name . ', ' . $employee->first_name . ' ' . ($employee->middle_name ?? ''),
                'position' => $employee->position,
                'office' => $employee->office?->name ?? 'N/A',
                'employment_status' => $employee->employmentStatus?->name ?? 'N/A',
                'claim_count' => $claims->count(),
                'total_amount' => $claims->sum('amount'),
            ];
        })->filter(function ($employee) {
            return $employee['claim_count'] > 0;
        })->sortByDesc('total_amount')->values();

        $summary = [
            'total_employees' => $employees->count(),
            'total_claims' => $employees->sum('claim_count'),
            'total_amount' => $employees->sum('total_amount'),
        ];

        return Inertia::render('TotalClaims/EmployeesByTypePrint', [
            'claim_type' => [
                'id' => $claimType->id,
                'name' => $claimType->name,
                'code' => $claimType->code,
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