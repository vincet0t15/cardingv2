<?php

namespace App\Contracts\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;

interface EmployeeDeductionRepositoryInterface
{
    public function getEmployeesWithDeductions(?int $month, ?int $year, ?int $officeId, ?int $employmentStatusId, ?string $search, bool $hasDeductions = true, int $perPage = 50): LengthAwarePaginator;
    public function getStatistics(array $employeeIds, int $year, ?int $month): array;
    public function getEmployeesForPrint(?int $month, int $year, ?int $officeId, ?int $employmentStatusId, bool $hasDeductions = true): Collection;
    public function getForCreate(int $employeeId): array;
    public function getForEdit(int $employeeId, int $month, int $year, ?string $salaryId): array;
    public function findById(int $id): ?Model;
    public function create(array $data): Model;
    public function update(int $id, array $data): Model;
    public function delete(int $id): bool;
    public function existsForEmployee(int $employeeId, ?int $salaryId, int $deductionTypeId, int $month, int $year): bool;
    public function getTakenPeriods(int $employeeId): array;
    public function getAllForEmployee(int $employeeId, ?int $month = null, ?int $year = null, ?string $salaryId = null): Collection;
}
