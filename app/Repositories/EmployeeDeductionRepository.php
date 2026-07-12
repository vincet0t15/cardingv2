<?php

namespace App\Repositories;

use App\Contracts\Repositories\EmployeeDeductionRepositoryInterface;
use App\Models\DeductionCategory;
use App\Models\DeductionType;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use App\Models\EmploymentStatus;
use App\Models\Office;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class EmployeeDeductionRepository implements EmployeeDeductionRepositoryInterface
{
    public function __construct(protected EmployeeDeduction $model) {}

    public function getEmployeesWithDeductions(?int $month, ?int $year, ?int $officeId, ?int $employmentStatusId, ?string $search, bool $hasDeductions = true, int $perPage = 50): LengthAwarePaginator
    {
        $baseQuery = Employee::query()
            ->with(['employmentStatus', 'office', 'latestSalary'])
            ->when($hasDeductions, function ($query) use ($year, $month) {
                $query->whereHas('employeeDeductions', function ($q) use ($year, $month) {
                    $q->where('pay_period_year', $year);
                    if ($month) {
                        $q->where('pay_period_month', $month);
                    }
                });
            })
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($officeId, fn($query, $officeId) => $query->where('office_id', $officeId))
            ->when($employmentStatusId, fn($query, $employmentStatusId) => $query->where('employment_status_id', $employmentStatusId));

        return $baseQuery->clone()
            ->with(['salaries' => fn($q) => $q->orderBy('effective_date', 'desc')])
            ->with(['employeeDeductions' => function ($query) use ($year, $month) {
                $query->where('pay_period_year', $year)
                    ->with('deductionType')
                    ->with('salary')
                    ->orderBy('pay_period_month', 'asc');
                if ($month) {
                    $query->where('pay_period_month', $month);
                }
            }])
            ->orderBy('last_name')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function getStatistics(array $employeeIds, int $year, ?int $month): array
    {
        return [
            'total_employees' => count($employeeIds),
            'total_deductions_amount' => $this->model->whereIn('employee_id', $employeeIds)
                ->where('pay_period_year', $year)
                ->when($month, fn($q) => $q->where('pay_period_month', $month))
                ->sum('amount'),
            'highest_deduction' => $this->model->whereIn('employee_id', $employeeIds)
                ->where('pay_period_year', $year)
                ->when($month, fn($q) => $q->where('pay_period_month', $month))
                ->max('amount') ?? 0,
        ];
    }

    public function getEmployeesForPrint(?int $month, int $year, ?int $officeId, ?int $employmentStatusId, bool $hasDeductions = true): Collection
    {
        return Employee::query()
            ->with(['employmentStatus', 'office'])
            ->when($hasDeductions, function ($query) use ($year, $month) {
                $query->whereHas('employeeDeductions', function ($q) use ($year, $month) {
                    $q->where('pay_period_year', $year)
                        ->where('pay_period_month', $month);
                });
            })
            ->when($officeId, fn($query, $officeId) => $query->where('office_id', $officeId))
            ->when($employmentStatusId, fn($query, $employmentStatusId) => $query->where('employment_status_id', $employmentStatusId))
            ->with(['salaries' => function ($query) use ($year, $month) {
                $query->where('effective_date', '<=', now()->setDate($year, $month, 1)->endOfMonth())
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['peras' => function ($query) use ($year, $month) {
                $query->where('effective_date', '<=', now()->setDate($year, $month, 1)->endOfMonth())
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['ratas' => function ($query) use ($year, $month) {
                $query->where('effective_date', '<=', now()->setDate($year, $month, 1)->endOfMonth())
                    ->orderBy('effective_date', 'desc');
            }])
            ->with(['deductions' => function ($query) use ($month, $year) {
                $query->where('pay_period_month', $month)
                    ->where('pay_period_year', $year)
                    ->with('deductionType')
                    ->with('salary');
            }])
            ->orderBy('last_name')
            ->get();
    }

    public function getForCreate(int $employeeId): array
    {
        $employee = Employee::with([
            'employmentStatus',
            'office',
            'salaries' => fn($q) => $q->orderBy('effective_date', 'desc'),
            'peras' => fn($q) => $q->orderBy('effective_date', 'desc'),
            'ratas' => fn($q) => $q->orderBy('effective_date', 'desc'),
        ])->findOrFail($employeeId);

        $deductionTypes = DeductionType::where('is_active', true)->orderBy('name')->get();
        $deductionCategories = DeductionCategory::with(['deductionTypes' => fn($q) => $q->where('is_active', true)->orderBy('name')])->orderBy('name')->get();
        $takenPeriods = $this->model->where('employee_id', $employeeId)
            ->get()
            ->map(fn($d) => "{$d->pay_period_year}-{$d->pay_period_month}")
            ->toArray();

        return compact('employee', 'deductionTypes', 'deductionCategories', 'takenPeriods');
    }

    public function getForEdit(int $employeeId, int $month, int $year, ?string $salaryId): array
    {
        $employee = Employee::with([
            'employmentStatus',
            'office',
            'salaries' => fn($q) => $q->orderBy('effective_date', 'desc'),
            'peras' => fn($q) => $q->orderBy('effective_date', 'desc'),
            'ratas' => fn($q) => $q->orderBy('effective_date', 'desc'),
        ])->findOrFail($employeeId);

        $deductionTypes = DeductionType::where('is_active', true)->orderBy('name')->get();

        $existingDeductionsQuery = $this->model->where('employee_id', $employeeId)
            ->where('pay_period_month', $month)
            ->where('pay_period_year', $year);

        if ($salaryId === 'null') {
            $existingDeductionsQuery->whereNull('salary_id');
        } elseif ($salaryId) {
            $existingDeductionsQuery->where('salary_id', $salaryId);
        }

        $existingDeductions = $existingDeductionsQuery->with(['deductionType', 'salary'])->get();
        $takenPeriods = $this->model->where('employee_id', $employeeId)
            ->get()
            ->map(fn($d) => "{$d->pay_period_year}-{$d->pay_period_month}")
            ->toArray();

        $deductionCategories = DeductionCategory::with(['deductionTypes' => fn($q) => $q->where('is_active', true)->orderBy('name')])->orderBy('name')->get();

        return compact('employee', 'deductionTypes', 'deductionCategories', 'existingDeductions', 'takenPeriods');
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
        $deduction = $this->model->findOrFail($id);
        $deduction->update($data);
        return $deduction;
    }

    public function delete(int $id): bool
    {
        $deduction = $this->model->findOrFail($id);
        return $deduction->delete();
    }

    public function existsForEmployee(int $employeeId, ?int $salaryId, int $deductionTypeId, int $month, int $year): bool
    {
        return $this->model->where('employee_id', $employeeId)
            ->where('salary_id', $salaryId)
            ->where('deduction_type_id', $deductionTypeId)
            ->where('pay_period_month', $month)
            ->where('pay_period_year', $year)
            ->exists();
    }

    public function getTakenPeriods(int $employeeId): array
    {
        return $this->model->where('employee_id', $employeeId)
            ->get()
            ->map(fn($d) => "{$d->pay_period_year}-{$d->pay_period_month}")
            ->toArray();
    }

    public function getAllForEmployee(int $employeeId, ?int $month = null, ?int $year = null, ?string $salaryId = null): Collection
    {
        return $this->model->where('employee_id', $employeeId)
            ->with('deductionType', 'salary')
            ->when($month, fn($q, $month) => $q->where('pay_period_month', $month))
            ->when($year, fn($q, $year) => $q->where('pay_period_year', $year))
            ->when($salaryId === 'null', fn($q) => $q->whereNull('salary_id'))
            ->when($salaryId && $salaryId !== 'null', fn($q, $salaryId) => $q->where('salary_id', $salaryId))
            ->orderBy('pay_period_year', 'desc')
            ->orderBy('pay_period_month', 'desc')
            ->get();
    }
}
