<?php

namespace App\Policies;

use App\Models\Employee;
use App\Models\User;

class EmployeePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('employees.manage');
    }

    public function view(User $user, Employee $employee): bool
    {
        return $user->can('employees.manage');
    }

    public function create(User $user): bool
    {
        return $user->can('employees.create');
    }

    public function update(User $user, Employee $employee): bool
    {
        return $user->can('employees.edit');
    }

    public function delete(User $user, Employee $employee): bool
    {
        return true; // Allow all - handle in controller
    }

    public function restore(User $user, Employee $employee): bool
    {
        return $user->can('employees.edit');
    }

    public function forceDelete(User $user, Employee $employee): bool
    {
        return $user->can('employees.delete');
    }
}
