<?php

namespace App\Contracts\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

interface NotificationRepositoryInterface
{
    public function getUserNotifications(int $userId, int $perPage = 20): LengthAwarePaginator;
    public function getRecentNotifications(int $userId, int $limit = 5): Collection;
    public function getUnreadCount(int $userId): int;
    public function markAsRead(int $notificationId, int $userId): bool;
    public function markAllAsRead(int $userId): bool;
}
