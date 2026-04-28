<?php

namespace App\Policies;

use App\Models\Claim;
use App\Models\User;

class ClaimPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('claims.view');
    }

    public function view(User $user, Claim $claim): bool
    {
        return $user->can('claims.view');
    }

    public function create(User $user): bool
    {
        return $user->can('claims.create');
    }

    public function update(User $user, Claim $claim): bool
    {
        return $user->can('claims.edit');
    }

    public function delete(User $user, Claim $claim): bool
    {
        // Allow deletion to reach the controller
        // The actual permission check is handled in the destroy method with HandlesDeletionRequests trait
        return true;
    }

    public function restore(User $user, Claim $claim): bool
    {
        return $user->can('claims.edit');
    }

    public function forceDelete(User $user, Claim $claim): bool
    {
        return $user->can('claims.delete');
    }
}
