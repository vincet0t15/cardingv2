<?php

namespace App\Policies;

use App\Models\DeductionType;
use App\Models\User;

class DeductionTypePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('deduction_types.view');
    }

    public function view(User $user, DeductionType $deductionType): bool
    {
        return $user->can('deduction_types.view');
    }

    public function create(User $user): bool
    {
        return $user->can('deduction_types.create');
    }

    public function update(User $user, DeductionType $deductionType): bool
    {
        return $user->can('deduction_types.edit');
    }

    public function delete(User $user, DeductionType $deductionType): bool
    {
        return $user->can('deduction_types.delete');
    }

    public function restore(User $user, DeductionType $deductionType): bool
    {
        return $user->can('deduction_types.edit');
    }

    public function forceDelete(User $user, DeductionType $deductionType): bool
    {
        return $user->can('deduction_types.delete');
    }
}
