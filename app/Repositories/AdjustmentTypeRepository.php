<?php

namespace App\Repositories;

use App\Contracts\Repositories\AdjustmentTypeRepositoryInterface;
use App\Models\AdjustmentType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class AdjustmentTypeRepository implements AdjustmentTypeRepositoryInterface
{
    public function __construct(protected AdjustmentType $model) {}

    public function getAllPaginated(?string $search = null, int $perPage = 10): LengthAwarePaginator
    {
        return $this->model->query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
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
        $adjustmentType = $this->model->findOrFail($id);
        $adjustmentType->update($data);
        return $adjustmentType;
    }

    public function delete(int $id): bool
    {
        $adjustmentType = $this->model->findOrFail($id);
        return $adjustmentType->delete();
    }

    public function hasAdjustments(int $id): bool
    {
        return $this->model->findOrFail($id)->adjustments()->exists();
    }

    public function getAll(): Collection
    {
        return $this->model->orderBy('name')->get();
    }
}
