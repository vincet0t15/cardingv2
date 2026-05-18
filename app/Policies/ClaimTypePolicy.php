<?php

namespace App\Policies;

use App\Models\ClaimType;
use App\Models\User;

class ClaimTypePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('claim_types.view');
    }

    public function view(User $user, ClaimType $claimType): bool
    {
        return $user->can('claim_types.view');
    }

    public function create(User $user): bool
    {
        return $user->can('claim_types.create');
    }

    public function update(User $user, ClaimType $claimType): bool
    {
        return $user->can('claim_types.edit');
    }

    public function delete(User $user, ClaimType $claimType): bool
    {
        return $user->can('claim_types.delete');
    }

    public function restore(User $user, ClaimType $claimType): bool
    {
        return $user->can('claim_types.edit');
    }

    public function forceDelete(User $user, ClaimType $claimType): bool
    {
        return $user->can('claim_types.delete');
    }
}
