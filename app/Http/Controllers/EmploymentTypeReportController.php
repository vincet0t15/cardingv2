<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmploymentStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmploymentTypeReportController extends Controller
{
    public function index(Request $request)
    {
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();

        $employeesQuery = Employee::with(['office', 'employmentStatus'])
            ->orderBy('last_name')
            ->orderBy('first_name');

        if ($request->filled('employment_status_id')) {
            $employeesQuery->where('employment_status_id', $request->employment_status_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $employeesQuery->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        if ($request->filled('office_id')) {
            $employeesQuery->where('office_id', $request->office_id);
        }

        $perPage = $request->input('per_page', 15);
        $employees = $employeesQuery->paginate($perPage);

        $selectedStatus = null;
        if ($request->filled('employment_status_id')) {
            $selectedStatus = EmploymentStatus::find($request->employment_status_id);
        }

        return Inertia::render('reports/EmploymentTypeReport', [
            'employees' => $employees->items(),
            'pagination' => [
                'current_page' => $employees->currentPage(),
                'last_page' => $employees->lastPage(),
                'per_page' => $employees->perPage(),
                'total' => $employees->total(),
            ],
            'employmentStatuses' => $employmentStatuses,
            'selectedStatus' => $selectedStatus,
            'filters' => [
                'employment_status_id' => $request->employment_status_id,
                'search' => $request->search,
                'office_id' => $request->office_id,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function print(Request $request)
    {
        $employeesQuery = Employee::with(['office', 'employmentStatus'])
            ->orderBy('last_name')
            ->orderBy('first_name');

        if ($request->filled('employment_status_id')) {
            $employeesQuery->where('employment_status_id', $request->employment_status_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $employeesQuery->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        if ($request->filled('office_id')) {
            $employeesQuery->where('office_id', $request->office_id);
        }

        $employees = $employeesQuery->get();

        $selectedStatus = null;
        if ($request->filled('employment_status_id')) {
            $selectedStatus = EmploymentStatus::find($request->employment_status_id);
        }

        return Inertia::render('reports/EmploymentTypeReportPrint', [
            'employees' => $employees->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'full_name' => trim($emp->last_name.', '.$emp->first_name.($emp->middle_name ? ' '.$emp->middle_name : '').($emp->suffix ? ' '.$emp->suffix : '')),
                    'position' => $emp->position ?? 'N/A',
                    'office' => $emp->office?->name ?? 'N/A',
                    'employment_status' => $emp->employmentStatus?->name ?? 'N/A',
                ];
            }),
            'selectedStatus' => $selectedStatus,
            'filters' => [
                'employment_status_id' => $request->employment_status_id,
                'search' => $request->search,
                'office_id' => $request->office_id,
            ],
        ]);
    }
}
