<?php

namespace App\Policies;

use App\Models\DeductionCategory;
use App\Models\User;

class DeductionCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('deduction_categories.view');
    }

    public function view(User $user, DeductionCategory $deductionCategory): bool
    {
        return $user->can('deduction_categories.view');
    }

    public function create(User $user): bool
    {
        return $user->can('deduction_categories.create');
    }

    public function update(User $user, DeductionCategory $deductionCategory): bool
    {
        return $user->can('deduction_categories.edit');
    }

    public function delete(User $user, DeductionCategory $deductionCategory): bool
    {
        return $user->can('deduction_categories.delete');
    }

    public function restore(User $user, DeductionCategory $deductionCategory): bool
    {
        return $user->can('deduction_categories.edit');
    }

    public function forceDelete(User $user, DeductionCategory $deductionCategory): bool
    {
        return $user->can('deduction_categories.delete');
    }
}
