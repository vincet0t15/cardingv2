<?php

namespace App\Repositories;

use App\Contracts\Repositories\HazardPayRepositoryInterface;
use App\Models\HazardPay;
use App\Models\Employee;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class HazardPayRepository implements HazardPayRepositoryInterface
{
    public function __construct(protected HazardPay $model) {}

    public function getEmployeesWithHazardPay(?string $search, ?int $officeId, ?int $employmentStatusId, ?int $month, ?int $year, int $perPage = 50): LengthAwarePaginator
    {
        return Employee::query()
            ->when($month && $year, function ($query) use ($month, $year) {
                $query->whereHas('hazardPays', function ($q) use ($month, $year) {
                    $periodStart = now()->setDate($year, $month, 1)->startOfMonth();
                    $periodEnd = now()->setDate($year, $month, 1)->endOfMonth();
                    $q->where('start_date', '<=', $periodEnd)
                        ->where(function ($query) use ($periodStart) {
                            $query->whereNull('end_date')
                                ->orWhere('end_date', '>=', $periodStart);
                        });
                });
            }, fn($query) => $query->has('hazardPays'))
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($officeId, fn($query, $officeId) => $query->where('office_id', $officeId))
            ->when($employmentStatusId, fn($query, $employmentStatusId) => $query->where('employment_status_id', $employmentStatusId))
            ->with(['employmentStatus', 'office', 'latestHazardPay'])
            ->orderBy('last_name', 'asc')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function getEmployeesForPrint(?int $month, ?int $year): Collection
    {
        return Employee::query()
            ->has('hazardPays')
            ->when($month && $year, function ($query) use ($month, $year) {
                $query->whereHas('hazardPays', function ($q) use ($month, $year) {
                    $periodStart = now()->setDate($year, $month, 1)->startOfMonth();
                    $periodEnd = now()->setDate($year, $month, 1)->endOfMonth();
                    $q->where('start_date', '<=', $periodEnd)
                        ->where(function ($query) use ($periodStart) {
                            $query->whereNull('end_date')
                                ->orWhere('end_date', '>=', $periodStart);
                        });
                });
            })
            ->with(['office', 'latestHazardPay'])
            ->orderBy('last_name', 'asc')
            ->get();
    }

    public function getHistory(int $employeeId): Collection
    {
        return $this->model->where('employee_id', $employeeId)
            ->with('createdBy')
            ->orderBy('start_date', 'desc')
            ->get();
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
        $hazardPay = $this->model->findOrFail($id);
        $hazardPay->update($data);
        return $hazardPay;
    }

    public function delete(int $id): bool
    {
        $hazardPay = $this->model->findOrFail($id);
        return $hazardPay->delete();
    }
}
