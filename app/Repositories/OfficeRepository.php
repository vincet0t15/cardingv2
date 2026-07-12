<?php

namespace App\Repositories;

use App\Contracts\Repositories\OfficeRepositoryInterface;
use App\Models\Office;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class OfficeRepository implements OfficeRepositoryInterface
{
    public function __construct(protected Office $model) {}

    public function getAllPaginated(?string $search = null, int $perPage = 50): LengthAwarePaginator
    {
        return $this->model->query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
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
        $office = $this->model->findOrFail($id);
        $office->update($data);
        return $office;
    }

    public function delete(int $id): bool
    {
        $office = $this->model->findOrFail($id);
        return $office->delete();
    }

    public function hasEmployees(int $id): bool
    {
        return $this->model->findOrFail($id)->employees()->exists();
    }

    public function getAll(): Collection
    {
        return $this->model->orderBy('name')->get();
    }
}
