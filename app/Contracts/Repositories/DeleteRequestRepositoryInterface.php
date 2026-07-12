<?php

namespace App\Contracts\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

interface DeleteRequestRepositoryInterface
{
    public function getAllPaginated(?string $status = null, int $perPage = 15): LengthAwarePaginator;
    public function getMyRequests(int $userId, ?string $status = null, int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id, array $with = []): ?Model;
    public function approve(int $id, int $approvedById): bool;
    public function reject(int $id, int $approvedById, ?string $reason = null): bool;
    public function getPendingForUser(int $userId): \Illuminate\Database\Eloquent\Collection;
}
