<?php

namespace App\Policies;

use App\Models\HazardPay;
use App\Models\User;

class HazardPayPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('hazard_pays.view');
    }

    public function view(User $user, HazardPay $hazardPay): bool
    {
        return $user->can('hazard_pays.view');
    }

    public function create(User $user): bool
    {
        return $user->can('hazard_pays.create');
    }

    public function update(User $user, HazardPay $hazardPay): bool
    {
        return $user->can('hazard_pays.edit');
    }

    public function delete(User $user, HazardPay $hazardPay): bool
    {
        return $user->can('hazard_pays.delete');
    }

    public function restore(User $user, HazardPay $hazardPay): bool
    {
        return $user->can('hazard_pays.edit');
    }

    public function forceDelete(User $user, HazardPay $hazardPay): bool
    {
        return $user->can('hazard_pays.delete');
    }
}
