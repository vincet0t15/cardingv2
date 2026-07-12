<?php

namespace App\Repositories;

use App\Contracts\Repositories\ClaimRepositoryInterface;
use App\Models\Claim;
use App\Models\ClaimType;
use App\Models\Employee;
use App\Models\Office;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class ClaimRepository implements ClaimRepositoryInterface
{
    public function __construct(protected Claim $model) {}

    public function getEmployeeClaims(int $employeeId, ?int $month = null, ?int $year = null, ?int $claimTypeId = null, int $perPage = 20): LengthAwarePaginator
    {
        return $this->model->where('employee_id', $employeeId)
            ->with(['claimType', 'salary'])
            ->orderBy('claim_date', 'desc')
            ->when($month, fn($q, $month) => $q->whereMonth('claim_date', $month))
            ->when($year, fn($q, $year) => $q->whereYear('claim_date', $year))
            ->when($claimTypeId, fn($q, $claimTypeId) => $q->where('claim_type_id', $claimTypeId))
            ->paginate($perPage)
            ->withQueryString();
    }

    public function getAvailableYears(int $employeeId): array
    {
        return $this->model->where('employee_id', $employeeId)
            ->selectRaw('DISTINCT YEAR(claim_date) as year')
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->toArray();
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
        $claim = $this->model->findOrFail($id);
        $claim->update($data);
        return $claim;
    }

    public function delete(int $id): bool
    {
        $claim = $this->model->findOrFail($id);
        return $claim->delete();
    }

    public function getForReport(?int $month, ?int $year, ?string $type, ?string $sortBy, ?int $office, ?string $employee, ?string $claimTypes, int $perPage = 25): array
    {
        // Implementation moved from controller
        $selectedClaimTypes = null;
        if ($claimTypes) {
            $selectedClaimTypes = array_map('trim', explode(',', $claimTypes));
        } elseif ($type === 'travel') {
            $selectedClaimTypes = ['TRAVEL', 'MEAL', 'CASH_ADVANCE_TRAVEL'];
        }

        $summaryQuery = Employee::query()->whereHas('claims');

        if ($office) {
            $summaryQuery->where('office_id', $office);
        }

        if ($employee) {
            $summaryQuery->where(function ($q) use ($employee) {
                $q->where('first_name', 'like', '%' . $employee . '%')
                    ->orWhere('last_name', 'like', '%' . $employee . '%');
            });
        }

        if ($month) {
            $summaryQuery->whereHas('claims', function ($query) use ($month, $year) {
                $query->whereMonth('claim_date', $month)
                    ->whereYear('claim_date', $year);
            });
        } else {
            $summaryQuery->whereHas('claims', function ($query) use ($year) {
                $query->whereYear('claim_date', $year);
            });
        }

        if ($selectedClaimTypes) {
            $summaryQuery->whereHas('claims', function ($query) use ($selectedClaimTypes) {
                $query->whereHas('claimType', function ($q) use ($selectedClaimTypes) {
                    $q->whereIn('code', $selectedClaimTypes);
                });
            });
        } elseif ($type === 'overtime') {
            $summaryQuery->whereHas('claims', function ($query) {
                $query->whereHas('claimType', function ($q) {
                    $q->where('code', 'OVERTIME');
                });
            });
        }

        $employeesWithClaims = (clone $summaryQuery)->with(['office'])->get()->map(function ($emp) use ($month, $year, $type, $selectedClaimTypes) {
            $claimsQuery = $emp->claims()->with(['claimType', 'salary'])->orderBy('claim_date', 'desc');

            if ($month) {
                $claimsQuery->whereMonth('claim_date', $month)->whereYear('claim_date', $year);
            } else {
                $claimsQuery->whereYear('claim_date', $year);
            }

            if ($selectedClaimTypes) {
                $claimsQuery->whereHas('claimType', fn($q) => $q->whereIn('code', $selectedClaimTypes));
            } elseif ($type === 'overtime') {
                $claimsQuery->whereHas('claimType', fn($q) => $q->where('code', 'OVERTIME'));
            }

            $claims = $claimsQuery->get();
            $claimTypeCounts = [];
            foreach ($selectedClaimTypes ?? [] as $code) {
                $claimTypeCounts[$code] = $claims->where('claimType.code', $code)->count();
            }

            return [
                'id' => $emp->id,
                'name' => $emp->last_name . ', ' . $emp->first_name,
                'office' => $emp->office?->name ?? 'N/A',
                'total_amount' => $claims->sum('amount'),
                'claim_count' => $claims->count(),
                'claim_type_counts' => $claimTypeCounts,
            ];
        });

        if ($sortBy === 'count') {
            $employees = $employeesWithClaims->sortByDesc('claim_count')->values();
        } else {
            $employees = $employeesWithClaims->sortByDesc('total_amount')->values();
        }

        return [
            'employees' => $employees,
            'summary' => [
                'total_employees' => $employees->count(),
                'total_claims' => $employees->sum('claim_count'),
                'total_amount' => $employees->sum('total_amount'),
            ],
        ];
    }

    public function getForReportPrint(?int $month, ?int $year, ?string $type, ?string $sortBy, ?int $office, ?string $claimTypes): Collection
    {
        // Simplified version for print
        $selectedClaimTypes = null;
        if ($claimTypes) {
            $selectedClaimTypes = array_map('trim', explode(',', $claimTypes));
        } elseif ($type === 'travel') {
            $selectedClaimTypes = ['TRAVEL', 'MEAL', 'CASH_ADVANCE_TRAVEL'];
        }

        $employeesQuery = Employee::with(['office'])->whereHas('claims');

        if ($office) {
            $employeesQuery->where('office_id', $office);
        }

        if ($month) {
            $employeesQuery->whereHas('claims', fn($q) => $q->whereMonth('claim_date', $month)->whereYear('claim_date', $year));
        } else {
            $employeesQuery->whereHas('claims', fn($q) => $q->whereYear('claim_date', $year));
        }

        if ($selectedClaimTypes) {
            $employeesQuery->whereHas('claims', fn($q) => $q->whereHas('claimType', fn($cq) => $cq->whereIn('code', $selectedClaimTypes)));
        }

        return $employeesQuery->get()->map(function ($employee) use ($month, $year, $selectedClaimTypes) {
            $claimsQuery = $employee->claims()->with(['claimType', 'salary'])->orderBy('claim_date', 'desc');
            if ($month) {
                $claimsQuery->whereMonth('claim_date', $month)->whereYear('claim_date', $year);
            } else {
                $claimsQuery->whereYear('claim_date', $year);
            }
            if ($selectedClaimTypes) {
                $claimsQuery->whereHas('claimType', fn($q) => $q->whereIn('code', $selectedClaimTypes));
            }
            $claims = $claimsQuery->get();

            return [
                'id' => $employee->id,
                'name' => $employee->last_name . ', ' . $employee->first_name,
                'office' => $employee->office?->name ?? 'N/A',
                'total_amount' => $claims->sum('amount'),
                'claim_count' => $claims->count(),
                'travel_count' => $claims->where('claimType.code', 'TRAVEL')->count(),
                'travel_amount' => $claims->where('claimType.code', 'TRAVEL')->sum('amount'),
                'overtime_count' => $claims->where('claimType.code', 'OVERTIME')->count(),
                'overtime_amount' => $claims->where('claimType.code', 'OVERTIME')->sum('amount'),
                'other_count' => $claims->whereNotIn('claimType.code', ['TRAVEL', 'OVERTIME'])->count(),
                'other_amount' => $claims->whereNotIn('claimType.code', ['TRAVEL', 'OVERTIME'])->sum('amount'),
            ];
        })->values();
    }

    public function getEmployeeDetail(int $employeeId, ?int $month, ?int $year, ?string $type): array
    {
        $employee = Employee::with('office')->findOrFail($employeeId);

        $claimsQuery = $employee->claims()->with(['claimType', 'salary'])->orderBy('claim_date', 'desc');

        if ($month) {
            $claimsQuery->whereMonth('claim_date', $month)->whereYear('claim_date', $year);
        } else {
            $claimsQuery->whereYear('claim_date', $year);
        }

        if ($type === 'travel') {
            $claimsQuery->whereHas('claimType', fn($q) => $q->where('code', 'TRAVEL'));
        } elseif ($type === 'overtime') {
            $claimsQuery->whereHas('claimType', fn($q) => $q->where('code', 'OVERTIME'));
        }

        $claims = $claimsQuery->get()->map(fn($claim) => [
            'id' => $claim->id,
            'claim_date' => $claim->claim_date,
            'purpose' => $claim->purpose,
            'amount' => $claim->amount,
            'claim_type' => [
                'code' => $claim->claimType?->code,
                'name' => $claim->claimType?->name,
            ],
        ]);

        return [
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->last_name . ', ' . $employee->first_name . ' ' . ($employee->middle_name ?? '') . ' ' . ($employee->suffix ?? ''),
                'position' => $employee->position,
                'office' => $employee->office?->name ?? 'N/A',
            ],
            'claims' => $claims,
            'summary' => [
                'total_claims' => $claims->count(),
                'total_amount' => $claims->sum('amount'),
                'travel_count' => $claims->where('claim_type.code', 'TRAVEL')->count(),
                'travel_amount' => $claims->where('claim_type.code', 'TRAVEL')->sum('amount'),
                'overtime_count' => $claims->where('claim_type.code', 'OVERTIME')->count(),
                'overtime_amount' => $claims->where('claim_type.code', 'OVERTIME')->sum('amount'),
                'other_count' => $claims->whereNotIn('claim_type.code', ['TRAVEL', 'OVERTIME'])->count(),
                'other_amount' => $claims->whereNotIn('claim_type.code', ['TRAVEL', 'OVERTIME'])->sum('amount'),
            ],
        ];
    }
}
