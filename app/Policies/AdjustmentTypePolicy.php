<?php

namespace App\Policies;

use App\Models\AdjustmentType;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class AdjustmentTypePolicy
{
    public function viewAny(User $user): Response
    {
        return $user->hasPermissionTo('adjustment_types.view')
            ? Response::allow()
            : Response::deny('You do not have permission to view adjustment types.');
    }

    public function view(User $user, AdjustmentType $adjustmentType): Response
    {
        return $user->hasPermissionTo('adjustment_types.view')
            ? Response::allow()
            : Response::deny('You do not have permission to view this adjustment type.');
    }

    public function create(User $user): Response
    {
        return $user->hasPermissionTo('adjustment_types.store')
            ? Response::allow()
            : Response::deny('You do not have permission to create adjustment types.');
    }

    public function update(User $user, AdjustmentType $adjustmentType): Response
    {
        return $user->hasPermissionTo('adjustment_types.edit')
            ? Response::allow()
            : Response::deny('You do not have permission to update adjustment types.');
    }

    public function delete(User $user, AdjustmentType $adjustmentType): Response
    {
        return $user->hasPermissionTo('adjustment_types.delete')
            ? Response::allow()
            : Response::deny('You do not have permission to delete adjustment types.');
    }
}
