<?php

namespace App\Repositories;

use App\Contracts\Repositories\DeleteRequestRepositoryInterface;
use App\Models\DeleteRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class DeleteRequestRepository implements DeleteRequestRepositoryInterface
{
    public function __construct(protected DeleteRequest $model) {}

    public function getAllPaginated(?string $status = null, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->query()
            ->with(['requestedBy', 'approvedBy'])
            ->orderBy('created_at', 'desc')
            ->when($status, fn($q, $status) => $q->where('status', $status))
            ->paginate($perPage);
    }

    public function getMyRequests(int $userId, ?string $status = null, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->where('requested_by', $userId)
            ->orderBy('created_at', 'desc')
            ->when($status, fn($q, $status) => $q->where('status', $status))
            ->paginate($perPage);
    }

    public function findById(int $id, array $with = []): ?Model
    {
        $query = $this->model;
        if (!empty($with)) {
            $query = $query->with($with);
        }
        return $query->find($id);
    }

    public function approve(int $id, int $approvedById): bool
    {
        $deleteRequest = $this->model->findOrFail($id);
        $model = $deleteRequest->requestable;

        if (!$model) {
            $deleteRequest->update(['status' => DeleteRequest::STATUS_REJECTED]);
            return false;
        }

        $model->delete();

        $deleteRequest->update([
            'status' => DeleteRequest::STATUS_APPROVED,
            'approved_by' => $approvedById,
            'approved_at' => now(),
        ]);

        return true;
    }

    public function reject(int $id, int $approvedById, ?string $reason = null): bool
    {
        $deleteRequest = $this->model->findOrFail($id);

        $deleteRequest->update([
            'status' => DeleteRequest::STATUS_REJECTED,
            'approved_by' => $approvedById,
            'approved_at' => now(),
            'reason' => $reason,
        ]);

        return true;
    }

    public function getPendingForUser(int $userId): Collection
    {
        return $this->model->where('status', DeleteRequest::STATUS_PENDING)
            ->where('requested_by', $userId)
            ->get()
            ->keyBy('requestable_id');
    }
}
