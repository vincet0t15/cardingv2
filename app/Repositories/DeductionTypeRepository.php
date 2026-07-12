<?php

namespace App\Repositories;

use App\Contracts\Repositories\DeductionTypeRepositoryInterface;
use App\Models\DeductionType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class DeductionTypeRepository implements DeductionTypeRepositoryInterface
{
    public function __construct(protected DeductionType $model) {}

    public function getAllPaginated(?string $search = null, int $perPage = 50): LengthAwarePaginator
    {
        return $this->model->query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
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
        $deductionType = $this->model->findOrFail($id);
        $deductionType->update($data);
        return $deductionType;
    }

    public function delete(int $id): bool
    {
        $deductionType = $this->model->findOrFail($id);
        return $deductionType->delete();
    }

    public function hasEmployeeDeductions(int $id): bool
    {
        return $this->model->findOrFail($id)->employeeDeductions()->exists();
    }

    public function getActive(): Collection
    {
        return $this->model->where('is_active', true)->orderBy('name')->get();
    }

    public function getAll(): Collection
    {
        return $this->model->orderBy('name')->get();
    }
}
