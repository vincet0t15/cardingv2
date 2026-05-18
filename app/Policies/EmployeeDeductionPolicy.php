<?php

namespace App\Policies;

use App\Models\EmployeeDeduction;
use App\Models\User;

class EmployeeDeductionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('deductions.view');
    }

    public function view(User $user, EmployeeDeduction $employeeDeduction): bool
    {
        return $user->can('deductions.view');
    }

    public function create(User $user): bool
    {
        return $user->can('deductions.create');
    }

    public function update(User $user, EmployeeDeduction $employeeDeduction): bool
    {
        return $user->can('deductions.edit');
    }

    public function delete(User $user, EmployeeDeduction $employeeDeduction): bool
    {
        // Authorization is handled by the controller's handleDeletion method
        // This allows users without permission to submit deletion requests
        return true;
    }

    public function restore(User $user, EmployeeDeduction $employeeDeduction): bool
    {
        return $user->can('deductions.edit');
    }

    public function forceDelete(User $user, EmployeeDeduction $employeeDeduction): bool
    {
        return $user->can('deductions.delete');
    }
}
