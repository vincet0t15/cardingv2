<?php

namespace App\Policies;

use App\Models\Office;
use App\Models\User;

class OfficePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('offices.view');
    }

    public function view(User $user, Office $office): bool
    {
        return $user->hasPermissionTo('offices.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('offices.create');
    }

    public function update(User $user, Office $office): bool
    {
        return $user->hasPermissionTo('offices.edit');
    }

    public function delete(User $user, Office $office): bool
    {
        // Allow all users - actual permission check happens in controller
        return true;
    }

    public function restore(User $user, Office $office): bool
    {
        return $user->hasPermissionTo('offices.edit');
    }

    public function forceDelete(User $user, Office $office): bool
    {
        // Allow all users - actual permission check happens in controller
        return true;
    }
}
