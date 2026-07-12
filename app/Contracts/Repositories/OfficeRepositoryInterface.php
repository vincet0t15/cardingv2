<?php

namespace App\Contracts\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

interface OfficeRepositoryInterface
{
    public function getAllPaginated(?string $search = null, int $perPage = 50): LengthAwarePaginator;
    public function findById(int $id): ?Model;
    public function create(array $data): Model;
    public function update(int $id, array $data): Model;
    public function delete(int $id): bool;
    public function hasEmployees(int $id): bool;
    public function getAll(): \Illuminate\Database\Eloquent\Collection;
}
