<?php

namespace App\Contracts\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

interface AuditLogRepositoryInterface
{
    public function getAllPaginated(?string $search = null, ?string $action = null, ?string $modelType = null, ?int $userId = null, ?string $dateFrom = null, ?string $dateTo = null, bool $excludeSettings = false, int $perPage = 20): LengthAwarePaginator;
    public function findById(int $id): ?Model;
    public function getStatistics(?string $search = null, ?string $action = null, ?string $modelType = null, ?int $userId = null, ?string $dateFrom = null, ?string $dateTo = null, bool $excludeSettings = false): array;
    public function getPerformanceMetrics(?string $search = null, ?string $action = null, ?string $modelType = null, ?int $userId = null, ?string $dateFrom = null, ?string $dateTo = null, bool $excludeSettings = false): Collection;
    public function getUserPerformance(int $userId, ?string $search = null, ?string $action = null, ?string $modelType = null, ?string $dateFrom = null, ?string $dateTo = null, bool $excludeSettings = false, int $perPage = 20): LengthAwarePaginator;
    public function export(?string $action = null, ?string $modelType = null, ?int $userId = null, ?string $dateFrom = null, ?string $dateTo = null, bool $excludeSettings = false): Collection;
    public function getModelTypes(): array;
}
