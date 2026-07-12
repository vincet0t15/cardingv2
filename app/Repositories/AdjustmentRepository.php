<?php

namespace App\Repositories;

use App\Contracts\Repositories\AdjustmentRepositoryInterface;
use App\Models\Adjustment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class AdjustmentRepository implements AdjustmentRepositoryInterface
{
    public function __construct(protected Adjustment $model) {}

    public function getAllPaginated(?string $status = null, ?string $type = null, ?int $employeeId = null, ?int $month = null, ?int $year = null, ?string $search = null, int $perPage = 20): LengthAwarePaginator
    {
        return $this->model->query()
            ->with(['employee.office', 'employee.employmentStatus', 'createdBy'])
            ->orderBy('created_at', 'desc')
            ->when($status, fn($q, $status) => $q->where('status', $status))
            ->when($type, fn($q, $type) => $q->where('adjustment_type', $type))
            ->when($employeeId, fn($q, $employeeId) => $q->where('employee_id', $employeeId))
            ->when($month && $year, fn($q) => $q->where('pay_period_month', $month)->where('pay_period_year', $year))
            ->when($search, function ($q, $search) {
                $q->whereHas('employee', function ($sq) use ($search) {
                    $sq->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%");
                });
            })
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findById(int $id, array $with = []): ?Model
    {
        $query = $this->model;
        if (!empty($with)) {
            $query = $query->with($with);
        }
        return $query->find($id);
    }

    public function create(array $data): Model
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): Model
    {
        $adjustment = $this->model->findOrFail($id);
        $adjustment->update($data);
        return $adjustment;
    }

    public function delete(int $id): bool
    {
        $adjustment = $this->model->findOrFail($id);
        return $adjustment->delete();
    }

    public function getStatistics(): array
    {
        return [
            'total_processed' => $this->model->processed()->count(),
            'total_amount_processed' => $this->model->processed()->sum('amount'),
            'unique_employees' => $this->model->distinct('employee_id')->count(),
        ];
    }

    public function getEmployeeAdjustments(int $employeeId): Collection
    {
        return $this->model->where('employee_id', $employeeId)
            ->with(['createdBy'])
            ->orderBy('pay_period_year', 'desc')
            ->orderBy('pay_period_month', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getForReport(?int $month, ?int $year, ?string $status, ?string $type): Collection
    {
        return $this->model->query()
            ->with(['employee.office', 'createdBy'])
            ->orderBy('effectivity_date', 'desc')
            ->when($month && $year, fn($q) => $q->where('pay_period_month', $month)->where('pay_period_year', $year))
            ->when($status, fn($q, $status) => $q->where('status', $status))
            ->when($type, fn($q, $type) => $q->where('adjustment_type', $type))
            ->get();
    }

    public function getAdjustmentTypes(): array
    {
        return $this->model->getAdjustmentTypes();
    }

    public function getAdjustmentsForPeriod(int $year, int $month): Collection
    {
        return $this->model->query()
            ->where('pay_period_year', $year)
            ->selectRaw('employee_id, pay_period_month, SUM(amount) as total')
            ->groupBy('employee_id', 'pay_period_month')
            ->get()
            ->groupBy('employee_id')
            ->map(fn($rows) => $rows->keyBy('pay_period_month'));
    }

    public function getAdjustmentsForPeriods(array $periods): Collection
    {
        return $this->model->query()
            ->where(function ($q) use ($periods) {
                foreach ($periods as $period) {
                    $q->orWhere(function ($q2) use ($period) {
                        $q2->where('pay_period_month', $period['month'])
                            ->where('pay_period_year', $period['year']);
                    });
                }
            })
            ->selectRaw('employee_id, pay_period_month, pay_period_year, SUM(amount) as total')
            ->groupBy('employee_id', 'pay_period_month', 'pay_period_year')
            ->get()
            ->groupBy('employee_id');
    }
}
