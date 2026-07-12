<?php

namespace App\Repositories;

use App\Contracts\Repositories\RataRepositoryInterface;
use App\Models\Rata;
use App\Models\Employee;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class RataRepository implements RataRepositoryInterface
{
    public function __construct(protected Rata $model) {}

    public function getEmployeesWithRata(?string $search, ?int $officeId, ?int $employmentStatusId, ?int $month, ?int $year, int $perPage = 50): LengthAwarePaginator
    {
        return Employee::query()
            ->where('is_rata_eligible', true)
            ->when($month && $year, function ($query) use ($month, $year) {
                $query->whereHas('ratas', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            }, fn($query) => $query->has('ratas'))
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($officeId, fn($query, $officeId) => $query->where('office_id', $officeId))
            ->when($employmentStatusId, fn($query, $employmentStatusId) => $query->where('employment_status_id', $employmentStatusId))
            ->with(['employmentStatus', 'office', 'latestRata'])
            ->orderBy('last_name', 'asc')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function getEmployeesForPrint(?int $month, ?int $year): Collection
    {
        return Employee::query()
            ->has('ratas')
            ->when($month && $year, function ($query) use ($month, $year) {
                $query->whereHas('ratas', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            })
            ->with(['office', 'latestRata'])
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
        $rata = $this->model->findOrFail($id);
        $rata->update($data);
        return $rata;
    }

    public function delete(int $id): bool
    {
        $rata = $this->model->findOrFail($id);
        return $rata->delete();
    }
}
