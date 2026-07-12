<?php

namespace App\Contracts\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;

interface SupplierTransactionRepositoryInterface
{
    public function getSupplierTransactions(int $supplierId, ?string $search = null, ?int $year = null, ?int $month = null, int $perPage = 15): LengthAwarePaginator;
    public function getSupplierTransactionsReport(int $supplierId, ?string $search = null, ?int $year = null, ?int $month = null): Collection;
    public function getYearOptions(int $supplierId): array;
    public function findById(int $id): ?Model;
    public function create(int $supplierId, array $data): Model;
    public function update(int $id, array $data): Model;
    public function delete(int $id): bool;
}
