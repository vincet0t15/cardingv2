<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\DeleteRequestRepositoryInterface;
use App\Models\DeleteRequest;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DeleteRequestController extends Controller
{
    public function __construct(
        private readonly DeleteRequestRepositoryInterface $deleteRequestRepo
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', DeleteRequest::class);

        $deleteRequests = $this->deleteRequestRepo->getAllPaginated($request->status);

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

        $deleteRequest = $this->deleteRequestRepo->findById($deleteRequest->id, ['requestedBy', 'approvedBy', 'requestable']);

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

        $result = $this->deleteRequestRepo->approve($deleteRequest->id, Auth::id());

        if (!$result) {
            return redirect()->back()->with('error', 'The requested item no longer exists.');
        }

        $this->markRequestNotificationAsRead($deleteRequest);

        return redirect()->route('delete-requests.index')->with('success', 'Item deleted successfully.');
    }

    public function reject(Request $request, DeleteRequest $deleteRequest)
    {
        $this->authorize('approve', DeleteRequest::class);

        if ($deleteRequest->status !== DeleteRequest::STATUS_PENDING) {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        $this->deleteRequestRepo->reject($deleteRequest->id, Auth::id(), $request->input('reason'));

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
        $deleteRequests = $this->deleteRequestRepo->getMyRequests(Auth::id(), $request->status);

        return Inertia::render('delete-requests/my-requests', [
            'deleteRequests' => $deleteRequests,
            'filters' => [
                'status' => $request->status,
            ],
        ]);
    }
}
