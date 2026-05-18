<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Office;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $users = User::query()
            ->with('roles:name')
            ->with('employee:id,first_name,last_name,office_id,user_id')
            ->select(['id', 'name', 'username', 'is_active', 'last_seen', 'created_at'])
            ->when($search, function ($query) use ($search) {
                $query->where('name', 'like', '%'.$search.'%')
                    ->orWhere('username', 'like', '%'.$search.'%');
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        // Get unlinked employees with search, office filter, and pagination
        $empSearch = $request->query('employee_search');
        $empOffice = $request->query('employee_office');

        $unlinkedEmployees = Employee::whereNull('user_id')
            ->with('office:id,name')
            ->when($empSearch, function ($query) use ($empSearch) {
                $query->where(function ($q) use ($empSearch) {
                    $q->where('first_name', 'like', '%'.$empSearch.'%')
                        ->orWhere('last_name', 'like', '%'.$empSearch.'%');
                });
            })
            ->when($empOffice, function ($query) use ($empOffice) {
                $query->where('office_id', $empOffice);
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(20, ['id', 'first_name', 'last_name', 'office_id'])
            ->withQueryString()
            ->through(function ($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->last_name.', '.$emp->first_name,
                    'office' => $emp->office?->name,
                ];
            });

        // Transform users to convert roles from objects to array of strings and add online status
        $users->getCollection()->transform(function ($user) {
            $user->roles = $user->roles->pluck('name')->toArray();
            $user->is_online = $user->last_seen && $user->last_seen->diffInMinutes(now()) < 5;
            $user->last_seen_formatted = $user->last_seen ? $user->last_seen->diffForHumans() : null;
            $user->linked_employee = $user->employee ? [
                'id' => $user->employee->id,
                'name' => $user->employee->last_name.', '.$user->employee->first_name,
                'office' => $user->employee->office?->name,
            ] : null;

            return $user;
        });

        $roles = Role::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                ];
            });

        $offices = Office::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(function ($office) {
                return [
                    'id' => $office->id,
                    'name' => $office->name,
                ];
            });

        return Inertia::render('Accounts/index', [
            'users' => $users,
            'roles' => $roles,
            'unlinkedEmployees' => $unlinkedEmployees,
            'filters' => [
                'search' => $search,
                'employee_search' => $empSearch,
                'employee_office' => $empOffice,
            ],
            'offices' => $offices,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'is_active' => 'boolean',
            'roles' => 'array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        if (isset($validated['is_active'])) {
            $user->is_active = $validated['is_active'];
        }

        $user->save();

        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        return redirect()->back()->with('success', 'Account updated successfully');
    }

    public function linkEmployee(Request $request, User $user)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);

        if ($employee->user_id && $employee->user_id !== $user->id) {
            return redirect()->back()->with('error', 'Employee is already linked to another account');
        }

        $employee->user_id = $user->id;
        $employee->save();

        return redirect()->back()->with('success', 'Employee linked successfully');
    }

    public function unlinkEmployee(User $user)
    {
        $employee = $user->employee;

        if ($employee) {
            $employee->user_id = null;
            $employee->save();
        }

        return redirect()->back()->with('success', 'Employee unlinked successfully');
    }
}
