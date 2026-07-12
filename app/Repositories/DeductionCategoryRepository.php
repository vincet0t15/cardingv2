<?php

namespace App\Repositories;

use App\Contracts\Repositories\DeductionCategoryRepositoryInterface;
use App\Models\DeductionCategory;
use App\Models\DeductionType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class DeductionCategoryRepository implements DeductionCategoryRepositoryInterface
{
    public function __construct(protected DeductionCategory $model) {}

    public function getAllPaginated(?string $search = null, int $perPage = 50): LengthAwarePaginator
    {
        return $this->model->query()
            ->with('deductionTypes')
            ->when($search, fn($q, $search) => $q->where('name', 'like', "%{$search}%"))
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
        $category = $this->model->findOrFail($id);
        $category->update($data);
        return $category;
    }

    public function delete(int $id): bool
    {
        $category = $this->model->findOrFail($id);
        return $category->delete();
    }

    public function hasDeductionTypes(int $id): bool
    {
        return $this->model->findOrFail($id)->deductionTypes()->exists();
    }

    public function getUncategorizedTypes(): array
    {
        return DeductionType::query()
            ->whereNull('category_id')
            ->orderBy('name')
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'code' => $t->code,
                'is_active' => (bool) $t->is_active,
                'category_id' => $t->category_id,
            ])
            ->toArray();
    }

    public function getAll(): Collection
    {
        return $this->model->orderBy('name')->get();
    }
}
