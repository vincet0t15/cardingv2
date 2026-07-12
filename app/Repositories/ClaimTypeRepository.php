<?php

namespace App\Repositories;

use App\Contracts\Repositories\ClaimTypeRepositoryInterface;
use App\Models\ClaimType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class ClaimTypeRepository implements ClaimTypeRepositoryInterface
{
    public function __construct(protected ClaimType $model) {}

    public function getAllPaginated(?string $search = null, int $perPage = 50): LengthAwarePaginator
    {
        return $this->model->query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', '%' . $search . '%')
                    ->orWhere('code', 'like', '%' . $search . '%');
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
        $claimType = $this->model->findOrFail($id);
        $claimType->update($data);
        return $claimType;
    }

    public function delete(int $id): bool
    {
        $claimType = $this->model->findOrFail($id);
        return $claimType->delete();
    }

    public function hasClaims(int $id): bool
    {
        return $this->model->findOrFail($id)->claims()->exists();
    }

    public function getActive(): Collection
    {
        return $this->model->active()->get();
    }

    public function getAll(): Collection
    {
        return $this->model->orderBy('name')->get();
    }
}
