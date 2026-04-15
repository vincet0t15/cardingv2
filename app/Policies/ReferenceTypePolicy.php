<?php

namespace App\Policies;

use App\Models\ReferenceType;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ReferenceTypePolicy
{
    public function viewAny(User $user): Response
    {
        return $user->hasPermissionTo('reference_types.view')
            ? Response::allow()
            : Response::deny('You do not have permission to view reference types.');
    }

    public function view(User $user, ReferenceType $referenceType): Response
    {
        return $user->hasPermissionTo('reference_types.view')
            ? Response::allow()
            : Response::deny('You do not have permission to view this reference type.');
    }

    public function create(User $user): Response
    {
        return $user->hasPermissionTo('reference_types.create')
            ? Response::allow()
            : Response::deny('You do not have permission to create reference types.');
    }

    public function update(User $user, ReferenceType $referenceType): Response
    {
        return $user->hasPermissionTo('reference_types.update')
            ? Response::allow()
            : Response::deny('You do not have permission to update reference types.');
    }

    public function delete(User $user, ReferenceType $referenceType): Response
    {
        return $user->hasPermissionTo('reference_types.delete')
            ? Response::allow()
            : Response::deny('You do not have permission to delete reference types.');
    }
}
