<?php

namespace App\Policies;

use App\Models\EmploymentStatus;
use App\Models\User;

class EmploymentStatusPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('employment_statuses.view');
    }

    public function view(User $user, EmploymentStatus $employmentStatus): bool
    {
        return $user->can('employment_statuses.view');
    }

    public function create(User $user): bool
    {
        return $user->can('employment_statuses.create');
    }

    public function update(User $user, EmploymentStatus $employmentStatus): bool
    {
        return $user->can('employment_statuses.edit');
    }

    public function delete(User $user, EmploymentStatus $employmentStatus): bool
    {
        return $user->can('employment_statuses.delete');
    }

    public function restore(User $user, EmploymentStatus $employmentStatus): bool
    {
        return $user->can('employment_statuses.edit');
    }

    public function forceDelete(User $user, EmploymentStatus $employmentStatus): bool
    {
        return $user->can('employment_statuses.delete');
    }
}
