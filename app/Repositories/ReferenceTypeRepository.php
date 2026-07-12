<?php

namespace App\Repositories;

use App\Contracts\Repositories\ReferenceTypeRepositoryInterface;
use App\Models\ReferenceType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class ReferenceTypeRepository implements ReferenceTypeRepositoryInterface
{
    public function __construct(protected ReferenceType $model) {}

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
        $referenceType = $this->model->findOrFail($id);
        $referenceType->update($data);
        return $referenceType;
    }

    public function delete(int $id): bool
    {
        $referenceType = $this->model->findOrFail($id);
        return $referenceType->delete();
    }

    public function hasAdjustments(int $id): bool
    {
        return $this->model->findOrFail($id)->adjustments()->exists();
    }

    public function getAll(): Collection
    {
        return $this->model->all();
    }
}
