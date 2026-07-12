<?php

namespace App\Repositories;

use App\Contracts\Repositories\DocumentTypeRepositoryInterface;
use App\Models\DocumentType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

class DocumentTypeRepository implements DocumentTypeRepositoryInterface
{
    public function __construct(protected DocumentType $model) {}

    public function getAllPaginated(?string $search = null, int $perPage = 20): LengthAwarePaginator
    {
        return $this->model->query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->with('createdBy')
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
        $documentType = $this->model->findOrFail($id);
        $documentType->update($data);
        return $documentType;
    }

    public function delete(int $id): bool
    {
        $documentType = $this->model->findOrFail($id);
        return $documentType->delete();
    }
}
