<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\Office;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Employee::class);
        $search = $request->input('search');
        $officeId = $request->input('office_id');
        $employmentStatusId = $request->input('employment_status_id');

        $employees = Employee::query()
            ->when($search, function ($query) use ($search) {
                $query->where('first_name', 'like', '%' . $search . '%')
                    ->orWhere('last_name', 'like', '%' . $search . '%');
            })
            ->when($officeId, function ($query) use ($officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($employmentStatusId, function ($query) use ($employmentStatusId) {
                $query->where('employment_status_id', $employmentStatusId);
            })
            ->with(['office', 'employmentStatus'])
            ->orderBy('last_name', 'asc')
            ->orderBy('first_name', 'asc')
            ->orderBy('middle_name', 'asc')
            ->paginate(50)
            ->withQueryString();

        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();

        return Inertia::render('employees/Index', [
            'employees' => $employees,
            'offices' => $offices,
            'employmentStatuses' => $employmentStatuses,
            'filters' => [
                'search' => $search,
                'office_id' => $officeId,
                'employment_status_id' => $employmentStatusId,
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Employee::class);
        $employmentStatuses = EmploymentStatus::all();
        $offices = Office::all();

        return Inertia::render('employees/create', [
            'employmentStatuses' => $employmentStatuses,
            'offices' => $offices,
            'similarEmployees' => session('similar_employees', []),
            'warning' => session('warning'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Employee::class);

        // Check for duplicate names
        $firstName = trim($request->input('first_name'));
        $lastName = trim($request->input('last_name'));
        $middleName = trim($request->input('middle_name') ?? '');

        // Check if user wants to proceed despite duplicates
        $forceCreate = $request->input('force_create', false);

        // Find similar employees
        $similarEmployees = Employee::where(function ($query) use ($firstName, $lastName, $middleName) {
            // Exact match on first and last name
            $query->where('first_name', 'LIKE', $firstName)
                ->where('last_name', 'LIKE', $lastName);
        })
            ->orWhere(function ($query) use ($firstName, $lastName) {
                // Soundex match (similar sounding names)
                $query->whereRaw('SOUNDEX(first_name) = SOUNDEX(?)', [$firstName])
                    ->whereRaw('SOUNDEX(last_name) = SOUNDEX(?)', [$lastName]);
            })
            ->orWhere(function ($query) use ($firstName, $lastName) {
                // Partial match (80% similarity)
                $query->where('first_name', 'LIKE', $firstName . '%')
                    ->where('last_name', 'LIKE', $lastName . '%');
            })
            ->with(['office', 'employmentStatus'])
            ->limit(10)
            ->get();

        // If duplicates found and user hasn't confirmed, redirect back with warning
        if ($similarEmployees->count() > 0 && !$forceCreate) {
            return redirect()->back()
                ->withInput()
                ->with('warning', 'Possible duplicate employees found')
                ->with('similar_employees', $similarEmployees->toArray());
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'suffix' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'is_rata_eligible' => 'boolean',
            'employment_status_id' => 'required|exists:employment_statuses,id',
            'office_id' => 'required|exists:offices,id',
            'photo' => ['nullable', 'image', 'max:2048', 'mimes:jpg,jpeg,png,webp'],
        ]);

        $path = $request->hasFile('photo')
            ? $request->file('photo')->store('employees', 'public')
            : null;

        Employee::create([
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'],
            'last_name' => $validated['last_name'],
            'suffix' => $validated['suffix'],
            'employment_status_id' => $validated['employment_status_id'],
            'office_id' => $validated['office_id'],
            'image_path' => $path,
            'position' => $validated['position'],
            'is_rata_eligible' => $validated['is_rata_eligible'] ?? false,
        ]);

        return redirect()->back()->with('success', 'Employee created successfully');
    }

    public function show(Request $request, Employee $employee): Response
    {
        $this->authorize('view', $employee);
        $employmentStatuses = EmploymentStatus::all();
        $offices = Office::all();

        return Inertia::render('employees/show', [
            'employee' => $employee,
            'employmentStatuses' => $employmentStatuses,
            'offices' => $offices,
        ]);
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $this->authorize('update', $employee);

        // Check for duplicate names (excluding current employee)
        $firstName = trim($request->input('first_name'));
        $lastName = trim($request->input('last_name'));
        $middleName = trim($request->input('middle_name') ?? '');

        // Check if user wants to proceed despite duplicates
        $forceUpdate = $request->input('force_update', false);

        // Find similar employees (excluding current one)
        $similarEmployees = Employee::where('id', '!=', $employee->id)
            ->where(function ($query) use ($firstName, $lastName, $middleName) {
                // Exact match on first and last name
                $query->where('first_name', 'LIKE', $firstName)
                    ->where('last_name', 'LIKE', $lastName);
            })
            ->orWhere(function ($query) use ($firstName, $lastName) {
                // Soundex match (similar sounding names)
                $query->whereRaw('SOUNDEX(first_name) = SOUNDEX(?)', [$firstName])
                    ->whereRaw('SOUNDEX(last_name) = SOUNDEX(?)', [$lastName]);
            })
            ->orWhere(function ($query) use ($firstName, $lastName) {
                // Partial match (80% similarity)
                $query->where('first_name', 'LIKE', $firstName . '%')
                    ->where('last_name', 'LIKE', $lastName . '%');
            })
            ->with(['office', 'employmentStatus'])
            ->limit(10)
            ->get();

        // If duplicates found and user hasn't confirmed, redirect back with warning
        if ($similarEmployees->count() > 0 && !$forceUpdate) {
            return redirect()->back()
                ->withInput()
                ->with('warning', 'Possible duplicate employees found')
                ->with('similar_employees', $similarEmployees->toArray())
                ->with('editing_employee_id', $employee->id);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'suffix' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'is_rata_eligible' => 'boolean',
            'employment_status_id' => 'required|exists:employment_statuses,id',
            'office_id' => 'required|exists:offices,id',
            'photo' => ['nullable', 'image', 'max:2048', 'mimes:jpg,jpeg,png,webp'],
        ]);

        if ($request->hasFile('photo')) {
            if ($employee->image_path) {
                Storage::disk('public')->delete($employee->image_path);
            }
            $employee->image_path = $request->file('photo')->store('employees', 'public');
        }

        $validated = $request->suffix == 'None' ? array_merge($validated, ['suffix' => null]) : $validated;
        $employee->update($validated);

        return redirect()->back()->with('success', 'Employee updated successfully');
    }

    public function destroy(Employee $employee): RedirectResponse
    {
        $this->authorize('delete', $employee);
        if ($employee->image_path) {
            Storage::disk('public')->delete($employee->image_path);
        }

        $employee->delete();

        return redirect()->route('employees.index')->with('success', 'Employee deleted successfully');
    }

    public function restore(int $id): RedirectResponse
    {
        $employee = Employee::withTrashed()->findOrFail($id);
        $this->authorize('restore', $employee);
        $employee->restore();

        return redirect()->back()->with('success', 'Employee restored successfully');
    }
}
