<?php

namespace App\Http\Controllers;

use App\Models\DeleteRequest;
use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\Notification;
use App\Models\Office;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    use HandlesDeletionRequests;

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Employee::class);
        $search = $request->input('search');
        $officeId = $request->input('office_id');
        $employmentStatusId = $request->input('employment_status_id');

        $query = Employee::query()
            ->with('office', 'employmentStatus')
            ->when($search, function ($query) use ($search) {
                $query->where('first_name', 'like', '%' . $search . '%')
                    ->orWhere('last_name', 'like', '%' . $search . '%');
            })
            ->when($officeId, function ($query) use ($officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($employmentStatusId, function ($query) use ($employmentStatusId) {
                $query->where('employment_status_id', $employmentStatusId);
            });

        $filters = [
            'search' => $search,
            'office_id' => $officeId,
            'employment_status_id' => $employmentStatusId,
        ];

        $employees = $query->orderBy('last_name')->orderBy('first_name')->orderBy('middle_name')->paginate(50);

        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();

        $stats = [
            'total_employees' => Employee::count(),
            'plantilla_count' => Employee::whereHas('employmentStatus', function ($q) {
                $q->whereIn('name', ['Plantilla', 'Co-Term']);
            })->count(),
            'cosjo_count' => Employee::whereHas('employmentStatus', function ($q) {
                $q->whereIn('name', ['COS', 'JO', 'COS/JO']);
            })->count(),
            'unique_offices' => Employee::distinct()->count('office_id'),
        ];

        return Inertia::render('employees/Index', [
            'employees' => $employees,
            'offices' => $offices,
            'employmentStatuses' => $employmentStatuses,
            'filters' => $filters,
            'statistics' => $stats,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Employee::class);
        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();

        return Inertia::render('employees/create', [
            'offices' => $offices,
            'employmentStatuses' => $employmentStatuses,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Employee::class);

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'suffix' => 'nullable|string|max:255',
            'position' => 'required|string|max:255',
            'office_id' => 'required|exists:offices,id',
            'employment_status_id' => 'required|exists:employment_statuses,id',
            'is_rata_eligible' => 'boolean',
        ]);

        $employee = Employee::create([
            ...$validated,
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('employees.show', $employee)->with('success', 'Employee created successfully');
    }

    public function show(Employee $employee): Response
    {
        $this->authorize('view', $employee);

        $employee->load(['office', 'employmentStatus', 'salaries', 'createdBy']);

        return Inertia::render('employees/show', [
            'employee' => $employee,
        ]);
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $this->authorize('update', $employee);

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'suffix' => 'nullable|string|max:255',
            'position' => 'required|string|max:255',
            'office_id' => 'required|exists:offices,id',
            'employment_status_id' => 'required|exists:employment_statuses,id',
            'is_rata_eligible' => 'boolean',
        ]);

        $employee->update($validated);

        return redirect()->back()->with('success', 'Employee updated successfully');
    }

    public function destroy(Request $request, Employee $employee): RedirectResponse
    {
        $user = Auth::user();


        if ($user->hasPermissionTo('employees.delete')) {
            if ($employee->image_path) {
                Storage::disk('public')->delete($employee->image_path);
            }
            $employee->delete();
            return redirect()->route('employees.index')->with('success', 'Employee deleted successfully');
        }

        $reason = $request->input('reason', 'No reason provided');

        $deleteRequest = DeleteRequest::create([
            'requestable_type' => Employee::class,
            'requestable_id' => $employee->id,
            'requested_by' => $user->id,
            'status' => DeleteRequest::STATUS_PENDING,
            'reason' => $reason,
        ]);

        // Notify super admins
        $superAdmins = \Spatie\Permission\Models\Role::where('name', 'super admin')->first()?->users ?? collect();
        foreach ($superAdmins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'delete_request',
                'title' => 'Delete Request',
                'message' => "{$user->name} requested to delete employee: {$employee->full_name} (ID: {$employee->id})",
                'link' => '/delete-requests',
                'notifiable_id' => $deleteRequest->id,
                'notifiable_type' => DeleteRequest::class,
            ]);
        }

        return redirect()->back()->with('info', 'You do not have permission to delete. A delete request has been sent to admin.');
    }

    public function restore(int $id): RedirectResponse
    {
        $employee = Employee::withTrashed()->findOrFail($id);
        $this->authorize('restore', $employee);
        $employee->restore();

        return redirect()->back()->with('success', 'Employee restored successfully');
    }
}
