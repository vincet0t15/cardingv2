<?php

namespace App\Repositories;

use App\Contracts\Repositories\PeraRepositoryInterface;
use App\Models\Pera;
use App\Models\Employee;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class PeraRepository implements PeraRepositoryInterface
{
    public function __construct(protected Pera $model) {}

    public function getEmployeesWithPera(?string $search, ?int $officeId, ?int $employmentStatusId, ?int $month, ?int $year, int $perPage = 50): LengthAwarePaginator
    {
        return Employee::query()
            ->when($month && $year, function ($query) use ($month, $year) {
                $query->whereHas('peras', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            }, fn($query) => $query->has('peras'))
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($officeId, fn($query, $officeId) => $query->where('office_id', $officeId))
            ->when($employmentStatusId, fn($query, $employmentStatusId) => $query->where('employment_status_id', $employmentStatusId))
            ->with(['employmentStatus', 'office', 'latestPera'])
            ->orderBy('last_name', 'asc')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function getEmployeesForPrint(?int $month, ?int $year): Collection
    {
        return Employee::query()
            ->has('peras')
            ->when($month && $year, function ($query) use ($month, $year) {
                $query->whereHas('peras', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            })
            ->with(['office', 'latestPera'])
            ->orderBy('last_name', 'asc')
            ->get();
    }

    public function getHistory(int $employeeId): Collection
    {
        return $this->model->where('employee_id', $employeeId)
            ->with('createdBy')
            ->orderBy('effective_date', 'desc')
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
        $pera = $this->model->findOrFail($id);
        $pera->update($data);
        return $pera;
    }

    public function delete(int $id): bool
    {
        $pera = $this->model->findOrFail($id);
        return $pera->delete();
    }
}
