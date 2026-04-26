<?php

namespace App\Policies;

use App\Models\DeleteRequest;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class DeleteRequestPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasRole(['admin', 'super admin']);
    }

    public function view(User $user, DeleteRequest $deleteRequest): bool
    {
        return $user->hasRole(['admin', 'super admin']) || $user->id === $deleteRequest->requested_by;
    }

    public function approve(User $user): bool
    {
        return $user->hasRole(['admin', 'super admin']);
    }

    public function delete(User $user, DeleteRequest $deleteRequest): bool
    {
        return $user->hasRole(['admin', 'super admin']) || $user->id === $deleteRequest->requested_by;
    }
}
