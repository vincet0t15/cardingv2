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
        return $user->can('adjustments.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Adjustment $adjustment): bool
    {
        return $user->can('adjustments.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('adjustments.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Adjustment $adjustment): bool
    {
        return $user->can('adjustments.edit') && $adjustment->status === 'pending';
    }

    /**
     * Determine whether the user can approve/reject the model.
     */
    public function approve(User $user, Adjustment $adjustment): bool
    {
        return $user->can('adjustments.approve') && $adjustment->status === 'pending';
    }

    /**
     * Determine whether the user can process the model.
     */
    public function process(User $user, Adjustment $adjustment): bool
    {
        return $user->can('adjustments.process') && $adjustment->status === 'approved';
    }

    /**
     * Determine whether the user can delete the model.
     *
     * Note: We allow the delete action to reach the controller, where it will be
     * handled by the HandlesDeletionRequests trait. If the user doesn't have the
     * 'adjustments.delete' permission, a deletion request will be created instead.
     */
    public function delete(User $user, Adjustment $adjustment): bool
    {
        // Allow deletion if status is pending or rejected
        // The actual permission check is handled in the destroy method
        return in_array($adjustment->status, ['pending', 'rejected']);
    }
}
