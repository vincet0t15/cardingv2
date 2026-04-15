<?php

namespace App\Policies;

use App\Models\Adjustment;
use App\Models\User;

class AdjustmentPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('view adjustments');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Adjustment $adjustment): bool
    {
        return $user->can('view adjustments');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('create adjustments');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Adjustment $adjustment): bool
    {
        return $user->can('edit adjustments') && $adjustment->status === 'pending';
    }

    /**
     * Determine whether the user can approve/reject the model.
     */
    public function approve(User $user, Adjustment $adjustment): bool
    {
        return $user->can('approve adjustments') && $adjustment->status === 'pending';
    }

    /**
     * Determine whether the user can process the model.
     */
    public function process(User $user, Adjustment $adjustment): bool
    {
        return $user->can('process adjustments') && $adjustment->status === 'approved';
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Adjustment $adjustment): bool
    {
        return $user->can('delete adjustments') &&
            in_array($adjustment->status, ['pending', 'rejected']);
    }
}
