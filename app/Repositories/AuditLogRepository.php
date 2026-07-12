<?php

namespace App\Repositories;

use App\Contracts\Repositories\AuditLogRepositoryInterface;
use App\Models\AuditLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class AuditLogRepository implements AuditLogRepositoryInterface
{
    public function __construct(protected AuditLog $model) {}

    public function getAllPaginated(?string $search = null, ?string $action = null, ?string $modelType = null, ?int $userId = null, ?string $dateFrom = null, ?string $dateTo = null, bool $excludeSettings = false, int $perPage = 20): LengthAwarePaginator
    {
        return $this->buildQuery($search, $action, $modelType, $userId, $dateFrom, $dateTo, $excludeSettings)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->appends(request()->except('page'));
    }

    public function findById(int $id): ?Model
    {
        return $this->model->with('user')->find($id);
    }

    public function getStatistics(?string $search = null, ?string $action = null, ?string $modelType = null, ?int $userId = null, ?string $dateFrom = null, ?string $dateTo = null, bool $excludeSettings = false): array
    {
        $query = $this->buildQuery($search, $action, $modelType, $userId, $dateFrom, $dateTo, $excludeSettings);

        return [
            'total_logs' => (clone $query)->count(),
            'today_logs' => (clone $query)->whereDate('created_at', today())->count(),
            'created_count' => (clone $query)->where('action', 'created')->count(),
            'updated_count' => (clone $query)->where('action', 'updated')->count(),
            'deleted_count' => (clone $query)->where('action', 'deleted')->count(),
        ];
    }

    public function getPerformanceMetrics(?string $search = null, ?string $action = null, ?string $modelType = null, ?int $userId = null, ?string $dateFrom = null, ?string $dateTo = null, bool $excludeSettings = false): Collection
    {
        return $this->buildQuery($search, $action, $modelType, $userId, $dateFrom, $dateTo, $excludeSettings)
            ->whereNotNull('user_id')
            ->selectRaw('user_id, count(*) as total_actions')
            ->selectRaw('sum(case when action = "created" then 1 else 0 end) as created_count')
            ->selectRaw('sum(case when action = "updated" then 1 else 0 end) as updated_count')
            ->selectRaw('sum(case when action = "deleted" then 1 else 0 end) as deleted_count')
            ->groupBy('user_id')
            ->reorder()
            ->orderByDesc('total_actions')
            ->with('user')
            ->get()
            ->map(fn($row) => [
                'user_id' => $row->user_id,
                'user_name' => $row->user?->name ?? 'Unknown',
                'created_count' => (int) $row->created_count,
                'updated_count' => (int) $row->updated_count,
                'deleted_count' => (int) $row->deleted_count,
                'total_actions' => (int) $row->total_actions,
            ]);
    }

    public function getUserPerformance(int $userId, ?string $search = null, ?string $action = null, ?string $modelType = null, ?string $dateFrom = null, ?string $dateTo = null, bool $excludeSettings = false, int $perPage = 20): LengthAwarePaginator
    {
        return $this->buildQuery($search, $action, $modelType, null, $dateFrom, $dateTo, $excludeSettings)
            ->where('user_id', $userId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->appends(request()->except('page'));
    }

    public function export(?string $action = null, ?string $modelType = null, ?int $userId = null, ?string $dateFrom = null, ?string $dateTo = null, bool $excludeSettings = false): Collection
    {
        return $this->model->with('user')
            ->when($action, fn($q, $action) => $q->where('action', $action))
            ->when($excludeSettings, fn($q) => $q->whereNotIn('model_type', $this->getSettingsModelTypes()))
            ->when($modelType, fn($q, $modelType) => $q->where('model_type', $modelType))
            ->when($userId, fn($q, $userId) => $q->where('user_id', $userId))
            ->when($dateFrom, fn($q, $dateFrom) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn($q, $dateTo) => $q->whereDate('created_at', '<=', $dateTo))
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getModelTypes(): array
    {
        return $this->model->distinct()->pluck('model_type')
            ->map(fn($modelType) => [
                'value' => $modelType,
                'label' => class_basename($modelType),
            ])
            ->values()
            ->toArray();
    }

    private function buildQuery(?string $search, ?string $action, ?string $modelType, ?int $userId, ?string $dateFrom, ?string $dateTo, bool $excludeSettings)
    {
        return $this->model->query()
            ->when($search, function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    $query->where('action', 'like', "%{$search}%")
                        ->orWhere('model_type', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('user', fn($q) => $q->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($excludeSettings, fn($q) => $q->whereNotIn('model_type', $this->getSettingsModelTypes()))
            ->when($action, fn($q, $action) => $q->where('action', $action))
            ->when($modelType, fn($q, $modelType) => $q->where('model_type', $modelType))
            ->when($userId, fn($q, $userId) => $q->where('user_id', $userId))
            ->when($dateFrom, fn($q, $dateFrom) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn($q, $dateTo) => $q->whereDate('created_at', '<=', $dateTo));
    }

    protected function getSettingsModelTypes(): array
    {
        return [
            \App\Models\Office::class,
            \App\Models\EmploymentStatus::class,
            \App\Models\ReferenceType::class,
            \App\Models\DocumentType::class,
            \App\Models\DeductionType::class,
            \App\Models\AdjustmentType::class,
            \App\Models\SourceOfFundCode::class,
            \App\Models\GeneralFund::class,
        ];
    }
}
