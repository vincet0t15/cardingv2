<?php

namespace App\Policies;

use App\Models\Pera;
use App\Models\User;

class PeraPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('peras.view');
    }

    public function view(User $user, Pera $pera): bool
    {
        return $user->can('peras.view');
    }

    public function create(User $user): bool
    {
        return $user->can('peras.create');
    }

    public function update(User $user, Pera $pera): bool
    {
        return $user->can('peras.edit');
    }

    public function delete(User $user, Pera $pera): bool
    {
        return $user->can('peras.delete');
    }

    public function restore(User $user, Pera $pera): bool
    {
        return $user->can('peras.edit');
    }

    public function forceDelete(User $user, Pera $pera): bool
    {
        return $user->can('peras.delete');
    }
}
