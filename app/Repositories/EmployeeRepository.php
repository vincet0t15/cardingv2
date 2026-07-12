<?php

namespace App\Repositories;

use App\Contracts\Repositories\EmployeeRepositoryInterface;
use App\Models\Employee;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class EmployeeRepository implements EmployeeRepositoryInterface
{
    public function __construct(protected Employee $model) {}

    public function getAllPaginated(?string $search = null, ?int $officeId = null, ?int $employmentStatusId = null, int $perPage = 50): LengthAwarePaginator
    {
        return $this->model->query()
            ->with('office', 'employmentStatus')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', '%' . $search . '%')
                        ->orWhere('last_name', 'like', '%' . $search . '%');
                });
            })
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($employmentStatusId, function ($query, $employmentStatusId) {
                $query->where('employment_status_id', $employmentStatusId);
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->orderBy('middle_name')
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
        $employee = $this->model->findOrFail($id);
        $employee->update($data);
        return $employee;
    }

    public function delete(int $id): bool
    {
        $employee = $this->model->findOrFail($id);
        return $employee->delete();
    }

    public function restore(int $id): Model
    {
        $employee = $this->model->withTrashed()->findOrFail($id);
        $employee->restore();
        return $employee;
    }

    public function getStatistics(): array
    {
        $statsRow = $this->model->query()
            ->leftJoin('employment_statuses', 'employment_statuses.id', '=', 'employees.employment_status_id')
            ->selectRaw('COUNT(*) as total_employees')
            ->selectRaw('COUNT(DISTINCT employees.office_id) as unique_offices')
            ->selectRaw('SUM(CASE WHEN employment_statuses.name IN (?, ?) THEN 1 ELSE 0 END) as plantilla_count', ['Plantilla', 'Co-Term'])
            ->selectRaw('SUM(CASE WHEN employment_statuses.name IN (?, ?, ?) THEN 1 ELSE 0 END) as cosjo_count', ['COS', 'JO', 'COS/JO'])
            ->first();

        return [
            'total_employees' => (int) ($statsRow->total_employees ?? 0),
            'plantilla_count' => (int) ($statsRow->plantilla_count ?? 0),
            'cosjo_count' => (int) ($statsRow->cosjo_count ?? 0),
            'unique_offices' => (int) ($statsRow->unique_offices ?? 0),
        ];
    }

    public function getAllWithRelations(array $with = []): Collection
    {
        return $this->model->with($with)->orderBy('last_name')->get();
    }

    public function findByUserId(int $userId): ?Model
    {
        return $this->model->where('user_id', $userId)->first();
    }

    public function getForPayroll(?string $search, ?int $officeId, ?int $employmentStatusId, int $year, int $month, int $perPage = 50): LengthAwarePaginator
    {
        $calculationMonth = ($month && $month != 0) ? $month : 12;

        return $this->model->query()
            ->with(['employmentStatus', 'office'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($employmentStatusId, function ($query, $employmentStatusId) {
                $query->where('employment_status_id', $employmentStatusId);
            })
            ->with(['salaries' => function ($query) use ($year, $calculationMonth) {
                $query->where('effective_date', '<=', now()->setDate($year, $calculationMonth, 1)->endOfMonth())
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['peras' => function ($query) use ($year, $calculationMonth) {
                $query->where('effective_date', '<=', now()->setDate($year, $calculationMonth, 1)->endOfMonth())
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['ratas' => function ($query) use ($year, $calculationMonth) {
                $query->where('effective_date', '<=', now()->setDate($year, $calculationMonth, 1)->endOfMonth())
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['hazardPays' => function ($query) use ($year, $calculationMonth) {
                $periodEnd = now()->setDate($year, $calculationMonth, 1)->endOfMonth();
                $periodStart = now()->setDate($year, $calculationMonth, 1)->startOfMonth();
                $query->where('start_date', '<=', $periodEnd)
                    ->where(function ($q) use ($periodEnd, $periodStart) {
                        $q->whereNull('end_date')
                            ->orWhere('end_date', '>=', $periodStart);
                    })
                    ->orderBy('start_date', 'desc');
            }])
            ->with(['clothingAllowances' => function ($query) use ($year, $calculationMonth) {
                $periodEnd = now()->setDate($year, $calculationMonth, 1)->endOfMonth();
                $periodStart = now()->setDate($year, $calculationMonth, 1)->startOfMonth();
                $query->where('start_date', '<=', $periodEnd)
                    ->where(function ($q) use ($periodEnd, $periodStart) {
                        $q->whereNull('end_date')
                            ->orWhere('end_date', '>=', $periodStart);
                    })
                    ->orderBy('start_date', 'desc');
            }])
            ->with(['deductions' => function ($query) use ($calculationMonth, $year) {
                $query->where('pay_period_month', $calculationMonth)
                    ->where('pay_period_year', $year)
                    ->with('deductionType');
            }])
            ->with(['adjustments' => function ($query) use ($calculationMonth, $year) {
                $query->where('pay_period_month', $calculationMonth)
                    ->where('pay_period_year', $year);
            }])
            ->orderBy('last_name', 'asc')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function getForPrint(?int $officeId, ?int $employeeId, int $year): Collection
    {
        return $this->model->query()
            ->with(['employmentStatus', 'office'])
            ->with(['salaries' => function ($query) use ($year) {
                $query->whereYear('effective_date', '<=', $year)
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['peras' => function ($query) use ($year) {
                $query->whereYear('effective_date', '<=', $year)
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['ratas' => function ($query) use ($year) {
                $query->whereYear('effective_date', '<=', $year)
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['hazardPays' => function ($query) use ($year) {
                $query->where('start_date', '<=', \Carbon\Carbon::create($year, 12, 31)->endOfDay())
                    ->where(function ($q) use ($year) {
                        $q->whereNull('end_date')
                            ->orWhere('end_date', '>=', \Carbon\Carbon::create($year, 1, 1)->startOfDay());
                    })
                    ->orderBy('start_date', 'desc');
            }])
            ->with(['clothingAllowances' => function ($query) use ($year) {
                $query->where('start_date', '<=', \Carbon\Carbon::create($year, 12, 31)->endOfDay())
                    ->where(function ($q) use ($year) {
                        $q->whereNull('end_date')
                            ->orWhere('end_date', '>=', \Carbon\Carbon::create($year, 1, 1)->startOfDay());
                    })
                    ->orderBy('start_date', 'desc');
            }])
            ->with(['deductions' => function ($query) use ($year) {
                $query->where('pay_period_year', $year);
            }])
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($employeeId, function ($query, $employeeId) {
                $query->where('id', $employeeId);
            })
            ->orderBy('last_name', 'asc')
            ->get();
    }

    public function getForComparison(?string $search, ?int $officeId, ?int $employmentStatusId, int $period1Month, int $period1Year, int $period2Month, int $period2Year): Collection
    {
        $period1End = now()->setDate($period1Year, $period1Month, 1)->endOfMonth();
        $period2End = now()->setDate($period2Year, $period2Month, 1)->endOfMonth();

        return $this->model->query()
            ->with(['employmentStatus', 'office'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($employmentStatusId, function ($query, $employmentStatusId) {
                $query->where('employment_status_id', $employmentStatusId);
            })
            ->with(['salaries' => function ($query) use ($period1End, $period2End) {
                $query->where('effective_date', '<=', max($period1End, $period2End))
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['peras' => function ($query) use ($period1End, $period2End) {
                $query->where('effective_date', '<=', max($period1End, $period2End))
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['ratas' => function ($query) use ($period1End, $period2End) {
                $query->where('effective_date', '<=', max($period1End, $period2End))
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['deductions' => function ($query) use ($period1Month, $period1Year, $period2Month, $period2Year) {
                $query->where(function ($q) use ($period1Month, $period1Year) {
                    $q->where('pay_period_month', $period1Month)
                        ->where('pay_period_year', $period1Year);
                })->orWhere(function ($q) use ($period2Month, $period2Year) {
                    $q->where('pay_period_month', $period2Month)
                        ->where('pay_period_year', $period2Year);
                });
            }])
            ->orderBy('last_name', 'asc')
            ->get();
    }
}
