<?php

namespace App\Contracts\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;

interface EmployeeRepositoryInterface
{
    public function getAllPaginated(?string $search = null, ?int $officeId = null, ?int $employmentStatusId = null, int $perPage = 50): LengthAwarePaginator;
    public function findById(int $id, array $with = []): ?Model;
    public function create(array $data): Model;
    public function update(int $id, array $data): Model;
    public function delete(int $id): bool;
    public function restore(int $id): Model;
    public function getStatistics(): array;
    public function getAllWithRelations(array $with = []): Collection;
    public function findByUserId(int $userId): ?Model;
    public function getForPayroll(?string $search, ?int $officeId, ?int $employmentStatusId, int $year, int $month, int $perPage = 50): LengthAwarePaginator;
    public function getForPrint(?int $officeId, ?int $employeeId, int $year): Collection;
    public function getForComparison(?string $search, ?int $officeId, ?int $employmentStatusId, int $period1Month, int $period1Year, int $period2Month, int $period2Year): Collection;
}
