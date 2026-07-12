<?php

namespace App\Contracts\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

interface SupplierRepositoryInterface
{
    public function getAllPaginated(?string $search = null, int $perPage = 20): LengthAwarePaginator;
    public function findById(int $id): ?Model;
    public function create(array $data): Model;
    public function update(int $id, array $data): Model;
    public function delete(int $id): bool;
}
