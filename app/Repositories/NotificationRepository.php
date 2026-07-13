<?php

namespace App\Repositories;

use App\Contracts\Repositories\NotificationRepositoryInterface;
use App\Models\Notification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class NotificationRepository implements NotificationRepositoryInterface
{
    public function __construct(protected Notification $model) {}

    public function getUserNotifications(int $userId, int $perPage = 20): LengthAwarePaginator
    {
        return $this->model->where('user_id', $userId)
            ->with('notifiable')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->through(fn($notification) => array_merge($notification->toArray(), [
                'actionable' => $notification->actionable,
            ]));
    }

    public function getRecentNotifications(int $userId, int $limit = 5): Collection
    {
        return $this->model->where('user_id', $userId)
            ->with('notifiable')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn($notification) => array_merge($notification->toArray(), [
                'actionable' => $notification->actionable,
            ]));
    }

    public function getUnreadCount(int $userId): int
    {
        return $this->model->where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }

    public function markAsRead(int $notificationId, int $userId): bool
    {
        $notification = $this->model->where('id', $notificationId)
            ->where('user_id', $userId)
            ->first();

        if (!$notification) {
            return false;
        }

        $notification->markAsRead();
        return true;
    }

    public function markAllAsRead(int $userId): bool
    {
        return (bool) $this->model->where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }
}
