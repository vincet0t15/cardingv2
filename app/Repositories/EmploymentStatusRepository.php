<?php

namespace App\Repositories;

use App\Contracts\Repositories\EmploymentStatusRepositoryInterface;
use App\Models\EmploymentStatus;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class EmploymentStatusRepository implements EmploymentStatusRepositoryInterface
{
    public function __construct(protected EmploymentStatus $model) {}

    public function getAllPaginated(?string $search = null, int $perPage = 10): LengthAwarePaginator
    {
        return $this->model->query()
            ->when($search, fn($query, $search) => $query->where('name', 'like', "%{$search}%"))
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
        $status = $this->model->findOrFail($id);
        $status->update($data);
        return $status;
    }

    public function delete(int $id): bool
    {
        $status = $this->model->findOrFail($id);
        return $status->delete();
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
