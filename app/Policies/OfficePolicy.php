<?php

namespace App\Policies;

use App\Models\Office;
use App\Models\User;

class OfficePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('offices.view');
    }

    public function view(User $user, Office $office): bool
    {
        return $user->can('offices.view');
    }

    public function create(User $user): bool
    {
        return $user->can('offices.create');
    }

    public function update(User $user, Office $office): bool
    {
        return $user->can('offices.edit');
    }

    public function delete(User $user, Office $office): bool
    {
        return $user->can('offices.delete');
    }

    public function restore(User $user, Office $office): bool
    {
        return $user->can('offices.edit');
    }

    public function forceDelete(User $user, Office $office): bool
    {
        return $user->can('offices.delete');
    }
}
