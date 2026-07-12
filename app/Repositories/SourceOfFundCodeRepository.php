<?php

namespace App\Repositories;

use App\Contracts\Repositories\SourceOfFundCodeRepositoryInterface;
use App\Models\SourceOfFundCode;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class SourceOfFundCodeRepository implements SourceOfFundCodeRepositoryInterface
{
    public function __construct(protected SourceOfFundCode $model) {}

    public function getAllPaginated(?string $search = null, int $perPage = 50): LengthAwarePaginator
    {
        return $this->model->query()
            ->with(['parent', 'generalFund'])
            ->when($search, function ($query, $search) {
                $query->where('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->orderByRaw('CASE WHEN is_category = 1 THEN 0 ELSE 1 END')
            ->orderBy('code')
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
        $code = $this->model->findOrFail($id);
        $code->update($data);
        return $code;
    }

    public function delete(int $id): bool
    {
        $code = $this->model->findOrFail($id);
        return $code->delete();
    }

    public function hasSalaries(int $id): bool
    {
        return $this->model->findOrFail($id)->salaries()->exists();
    }

    public function hasChildren(int $id): bool
    {
        return $this->model->findOrFail($id)->children()->exists();
    }

    public function getCategories(): Collection
    {
        return $this->model->where('is_category', true)
            ->orderBy('code')
            ->get();
    }

    public function getAll(): Collection
    {
        return $this->model->orderBy('code')->get();
    }

    public function getActive(): Collection
    {
        return $this->model->where('status', true)
            ->orderBy('code')
            ->get();
    }
}
