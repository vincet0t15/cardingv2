<?php

namespace App\Traits;

use App\Models\DeleteRequest;
use App\Models\Notification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Trait HandlesDeletionRequests
 *
 * Provides a unified deletion workflow that:
 * 1. Only allows direct deletion if user has specific delete permission
 * 2. Otherwise creates a DeleteRequest for super admin approval
 * 3. Sends notifications to super admins
 */
trait HandlesDeletionRequests
{
    /**
     * Handle deletion of a model through the DeleteRequest workflow
     *
     * @param Model $model The model to delete
     * @param string $permissionName The permission name (e.g., 'employees.delete')
     * @param string $reason Optional reason for deletion
     * @return RedirectResponse
     */
    protected function handleDeletion(Model $model, string $permissionName, ?string $reason = null): RedirectResponse
    {
        $user = Auth::user();

        // Check if user has direct permission to delete
        if ($user->hasPermissionTo($permissionName)) {
            $model->delete();
            $modelName = class_basename($model);
            return redirect()
                ->back()
                ->with('success', "{$modelName} deleted successfully by super admin.");
        }

        // User doesn't have permission - create delete request
        $reason = $reason ?? request()->input('reason', 'No reason provided');

        $deleteRequest = DeleteRequest::create([
            'requestable_type' => $model::class,
            'requestable_id' => $model->id,
            'requested_by' => $user->id,
            'status' => DeleteRequest::STATUS_PENDING,
            'reason' => $reason,
        ]);

        // Notify super admins
        $this->notifySuperAdminsOfDeletionRequest($deleteRequest, $model, $user);

        $modelName = class_basename($model);
        return redirect()
            ->back()
            ->with('success', "{$modelName} deletion request sent to super admin for approval.");
    }

    /**
     * Send notifications to all super admins about a deletion request
     */
    protected function notifySuperAdminsOfDeletionRequest(DeleteRequest $deleteRequest, Model $model, $user): void
    {
        $superAdmins = \Spatie\Permission\Models\Role::where('name', 'super admin')
            ->first()
            ?->users
            ?? collect();

        $modelName = class_basename($model);
        $modelIdentifier = $this->getModelIdentifier($model);

        foreach ($superAdmins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'delete_request',
                'title' => 'Delete Request',
                'message' => "{$user->name} requested to delete {$modelName}: {$modelIdentifier}",
                'link' => '/delete-requests',
                'notifiable_id' => $deleteRequest->id,
                'notifiable_type' => DeleteRequest::class,
            ]);
        }
    }

    /**
     * Get a human-readable identifier for the model
     */
    protected function getModelIdentifier(Model $model): string
    {
        // Try common name fields
        if ($model->offsetExists('name')) {
            return $model->name;
        }
        if ($model->offsetExists('full_name')) {
            return $model->full_name;
        }
        if ($model->offsetExists('title')) {
            return $model->title;
        }
        // Fallback to ID
        return "ID: {$model->id}";
    }
}
