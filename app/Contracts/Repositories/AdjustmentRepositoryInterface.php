<?php

namespace App\Contracts\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;

interface AdjustmentRepositoryInterface
{
    public function getAllPaginated(?string $status = null, ?string $type = null, ?int $employeeId = null, ?int $month = null, ?int $year = null, ?string $search = null, int $perPage = 20): LengthAwarePaginator;
    public function findById(int $id, array $with = []): ?Model;
    public function create(array $data): Model;
    public function update(int $id, array $data): Model;
    public function delete(int $id): bool;
    public function getStatistics(): array;
    public function getEmployeeAdjustments(int $employeeId): Collection;
    public function getForReport(?int $month, ?int $year, ?string $status, ?string $type): Collection;
    public function getAdjustmentTypes(): array;
    public function getAdjustmentsForPeriod(int $year, int $month): Collection;
    public function getAdjustmentsForPeriods(array $periods): Collection;
}
