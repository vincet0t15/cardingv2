<?php

namespace App\Policies;

use App\Models\Salary;
use App\Models\User;

class SalaryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('salaries.view');
    }

    public function view(User $user, Salary $salary): bool
    {
        return $user->can('salaries.view');
    }

    public function create(User $user): bool
    {
        return $user->can('salaries.create');
    }

    public function update(User $user, Salary $salary): bool
    {
        return $user->can('salaries.edit');
    }

    public function delete(User $user, Salary $salary): bool
    {
        return $user->can('salaries.delete');
    }

    public function restore(User $user, Salary $salary): bool
    {
        return $user->can('salaries.edit');
    }

    public function forceDelete(User $user, Salary $salary): bool
    {
        return $user->can('salaries.delete');
    }
}
