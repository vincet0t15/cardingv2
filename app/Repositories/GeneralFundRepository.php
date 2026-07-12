<?php

namespace App\Repositories;

use App\Contracts\Repositories\GeneralFundRepositoryInterface;
use App\Models\GeneralFund;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class GeneralFundRepository implements GeneralFundRepositoryInterface
{
    public function __construct(protected GeneralFund $model) {}

    public function getAllPaginated(?string $search = null, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->query()
            ->withCount('sourceOfFundCodes')
            ->with(['sourceOfFundCodes' => fn($q) => $q->orderBy('code')])
            ->when($search, function ($query, $search) {
                $query->where('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
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
        $fund = $this->model->findOrFail($id);
        $fund->update($data);
        return $fund;
    }

    public function delete(int $id): bool
    {
        $fund = $this->model->findOrFail($id);
        return $fund->delete();
    }

    public function hasSourceOfFundCodes(int $id): bool
    {
        return $this->model->findOrFail($id)->sourceOfFundCodes()->exists();
    }

    public function getAll(): Collection
    {
        return $this->model->orderBy('code')->get();
    }

    public function getActive(): Collection
    {
        return $this->model->where('status', true)->orderBy('code')->get();
    }
}
