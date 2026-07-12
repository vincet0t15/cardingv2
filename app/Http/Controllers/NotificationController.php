<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\NotificationRepositoryInterface;
use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationRepositoryInterface $notificationRepo
    ) {}

    public function index(Request $request)
    {
        $notifications = $this->notificationRepo->getUserNotifications($request->user()->id);

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
        ]);
    }

    public function recent(Request $request)
    {
        $notifications = $this->notificationRepo->getRecentNotifications($request->user()->id);

        return response()->json([
            'notifications' => $notifications,
        ]);
    }

    public function unreadCount(Request $request)
    {
        return response()->json([
            'count' => $this->notificationRepo->getUnreadCount($request->user()->id),
        ]);
    }

    public function markAsRead(Notification $notification, Request $request)
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $this->notificationRepo->markAsRead($notification->id, $request->user()->id);

        return response()->json(['success' => true]);
    }

    public function markAllAsRead(Request $request)
    {
        $this->notificationRepo->markAllAsRead($request->user()->id);

        return response()->json(['success' => true]);
    }
}
