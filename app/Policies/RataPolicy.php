<?php

namespace App\Policies;

use App\Models\Rata;
use App\Models\User;

class RataPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('ratas.view');
    }

    public function view(User $user, Rata $rata): bool
    {
        return $user->can('ratas.view');
    }

    public function create(User $user): bool
    {
        return $user->can('ratas.create');
    }

    public function update(User $user, Rata $rata): bool
    {
        return $user->can('ratas.edit');
    }

    public function delete(User $user, Rata $rata): bool
    {
        return $user->can('ratas.delete');
    }

    public function restore(User $user, Rata $rata): bool
    {
        return $user->can('ratas.edit');
    }

    public function forceDelete(User $user, Rata $rata): bool
    {
        return $user->can('ratas.delete');
    }
}
