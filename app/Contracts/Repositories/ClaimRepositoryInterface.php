<?php

namespace App\Contracts\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;

interface ClaimRepositoryInterface
{
    public function getEmployeeClaims(int $employeeId, ?int $month = null, ?int $year = null, ?int $claimTypeId = null, int $perPage = 20): LengthAwarePaginator;
    public function getAvailableYears(int $employeeId): array;
    public function findById(int $id): ?Model;
    public function create(array $data): Model;
    public function update(int $id, array $data): Model;
    public function delete(int $id): bool;
    public function getForReport(?int $month, ?int $year, ?string $type, ?string $sortBy, ?int $office, ?string $employee, ?string $claimTypes, int $perPage = 25): array;
    public function getForReportPrint(?int $month, ?int $year, ?string $type, ?string $sortBy, ?int $office, ?string $claimTypes): Collection;
    public function getEmployeeDetail(int $employeeId, ?int $month, ?int $year, ?string $type): array;
}
