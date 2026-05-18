<?php

namespace App\Http\Controllers;

use App\Models\DeleteRequest;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DeleteRequestController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', DeleteRequest::class);

        $query = DeleteRequest::with(['requestedBy', 'approvedBy'])
            ->orderBy('created_at', 'desc');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $deleteRequests = $query->paginate(15);

        // Ensure relationships are included in the response
        $deleteRequests = $deleteRequests->through(fn($request) => [
            ...$request->toArray(),
            'requestedBy' => $request->requestedBy?->only(['id', 'name', 'username']),
            'approvedBy' => $request->approvedBy?->only(['id', 'name', 'username']),
        ]);

        return Inertia::render('delete-requests/index', [
            'deleteRequests' => $deleteRequests,
            'filters' => [
                'status' => $request->status,
            ],
        ]);
    }

    public function show(DeleteRequest $deleteRequest)
    {
        $this->authorize('view', $deleteRequest);

        $deleteRequest->load(['requestedBy', 'approvedBy', 'requestable']);

        return Inertia::render('delete-requests/show', [
            'deleteRequest' => $deleteRequest,
        ]);
    }

    public function approve(Request $request, DeleteRequest $deleteRequest)
    {
        $this->authorize('approve', DeleteRequest::class);

        if ($deleteRequest->status !== DeleteRequest::STATUS_PENDING) {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        $model = $deleteRequest->requestable;

        if (!$model) {
            $deleteRequest->update(['status' => DeleteRequest::STATUS_REJECTED]);
            $this->markRequestNotificationAsRead($deleteRequest);
            return redirect()->back()->with('error', 'The requested item no longer exists.');
        }

        $model->delete();

        $deleteRequest->update([
            'status' => DeleteRequest::STATUS_APPROVED,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        $this->markRequestNotificationAsRead($deleteRequest);

        return redirect()->route('delete-requests.index')->with('success', 'Item deleted successfully.');
    }

    public function reject(Request $request, DeleteRequest $deleteRequest)
    {
        $this->authorize('approve', DeleteRequest::class);

        if ($deleteRequest->status !== DeleteRequest::STATUS_PENDING) {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        $deleteRequest->update([
            'status' => DeleteRequest::STATUS_REJECTED,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'reason' => $request->input('reason'),
        ]);

        $this->markRequestNotificationAsRead($deleteRequest);

        return redirect()->route('delete-requests.index')->with('success', 'Delete request rejected.');
    }

    protected function markRequestNotificationAsRead(DeleteRequest $deleteRequest): void
    {
        $user = Auth::user();

        if (!$user) {
            return;
        }

        Notification::where('user_id', $user->id)
            ->where('notifiable_type', DeleteRequest::class)
            ->where('notifiable_id', $deleteRequest->id)
            ->update(['is_read' => true]);
    }

    public function myRequests(Request $request)
    {
        $query = DeleteRequest::where('requested_by', Auth::id())
            ->orderBy('created_at', 'desc');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $deleteRequests = $query->paginate(15);

        return Inertia::render('delete-requests/my-requests', [
            'deleteRequests' => $deleteRequests,
            'filters' => [
                'status' => $request->status,
            ],
        ]);
    }
}
