<?php

namespace App\Policies;

use App\Models\ClothingAllowance;
use App\Models\User;

class ClothingAllowancePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('clothing_allowances.view');
    }

    public function view(User $user, ClothingAllowance $clothingAllowance): bool
    {
        return $user->can('clothing_allowances.view');
    }

    public function create(User $user): bool
    {
        return $user->can('clothing_allowances.create');
    }

    public function update(User $user, ClothingAllowance $clothingAllowance): bool
    {
        return $user->can('clothing_allowances.edit');
    }

    public function delete(User $user, ClothingAllowance $clothingAllowance): bool
    {
        return $user->can('clothing_allowances.delete');
    }

    public function restore(User $user, ClothingAllowance $clothingAllowance): bool
    {
        return $user->can('clothing_allowances.edit');
    }

    public function forceDelete(User $user, ClothingAllowance $clothingAllowance): bool
    {
        return $user->can('clothing_allowances.delete');
    }
}
