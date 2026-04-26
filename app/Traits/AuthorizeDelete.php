<?php

namespace App\Traits;

use App\Models\DeleteRequest;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

trait AuthorizeDelete
{
    protected function authorizeDelete(Request $request, $model, string $deletePermission, string $label): bool|RedirectResponse
    {
        $user = Auth::user();
        
        if ($user->can($deletePermission, $model)) {
            return true;
        }

        $reason = $request->input('reason', 'No reason provided');

        $deleteRequest = DeleteRequest::create([
            'requestable_type' => get_class($model),
            'requestable_id' => $model->id,
            'requested_by' => $user->id,
            'status' => DeleteRequest::STATUS_PENDING,
            'reason' => $reason,
        ]);

        Notification::notifyAdmins(
            Notification::TYPE_DELETE_REQUEST,
            'Delete Request',
            "{$user->name} requested to delete {$label} (ID: {$model->id})",
            route('delete-requests.index'),
            $deleteRequest
        );

        return redirect()->back()->with('info', 'You do not have permission to delete. A delete request has been sent to admin.');
    }

    protected function approveDelete(Request $request, DeleteRequest $deleteRequest): bool|RedirectResponse
    {
        $user = Auth::user();

        if (!$user->can('approve delete requests')) {
            return redirect()->back()->with('error', 'You do not have permission to approve delete requests.');
        }

        $model = $deleteRequest->requestable;

        if (!$model) {
            return redirect()->back()->with('error', 'The requested item no longer exists.');
        }

        $model->delete();

        $deleteRequest->update([
            'status' => DeleteRequest::STATUS_APPROVED,
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Item deleted successfully.');
    }

    protected function rejectDelete(Request $request, DeleteRequest $deleteRequest): bool|RedirectResponse
    {
        $user = Auth::user();

        if (!$user->can('approve delete requests')) {
            return redirect()->back()->with('error', 'You do not have permission to reject delete requests.');
        }

        $deleteRequest->update([
            'status' => DeleteRequest::STATUS_REJECTED,
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Delete request rejected.');
    }
}