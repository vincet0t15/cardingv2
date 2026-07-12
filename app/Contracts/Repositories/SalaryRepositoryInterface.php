<?php

namespace App\Contracts\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;

interface SalaryRepositoryInterface
{
    public function getEmployeesWithSalaries(?string $search, ?int $officeId, ?int $employmentStatusId, ?int $month, ?int $year, int $perPage = 50): LengthAwarePaginator;
    public function getEmployeesForPrint(?int $month, ?int $year): Collection;
    public function getHistory(int $employeeId): Collection;
    public function findById(int $id): ?Model;
    public function create(array $data): Model;
    public function update(int $id, array $data): Model;
    public function delete(int $id): bool;
    public function getByOfficeAndFund(?int $month, ?int $year, ?int $officeId): array;
}
