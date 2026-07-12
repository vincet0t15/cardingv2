<?php

namespace App\Repositories;

use App\Contracts\Repositories\SupplierRepositoryInterface;
use App\Models\Supplier;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

class SupplierRepository implements SupplierRepositoryInterface
{
    public function __construct(protected Supplier $model) {}

    public function getAllPaginated(?string $search = null, int $perPage = 20): LengthAwarePaginator
    {
        return $this->model->query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findById(int $id): ?Model
    {
        return $this->model->find($id);
    }

    public function create(array $data): Model
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): Model
    {
        $supplier = $this->model->findOrFail($id);
        $supplier->update($data);
        return $supplier;
    }

    public function delete(int $id): bool
    {
        $supplier = $this->model->findOrFail($id);
        return $supplier->delete();
    }
}
