<?php

namespace App\Repositories;

use App\Contracts\Repositories\SalaryRepositoryInterface;
use App\Models\Employee;
use App\Models\GeneralFund;
use App\Models\Office;
use App\Models\Salary;
use App\Models\SourceOfFundCode;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class SalaryRepository implements SalaryRepositoryInterface
{
    public function __construct(protected Salary $model) {}

    public function getEmployeesWithSalaries(?string $search, ?int $officeId, ?int $employmentStatusId, ?int $month, ?int $year, int $perPage = 50): LengthAwarePaginator
    {
        return Employee::query()
            ->when($month && $year, function ($query) use ($month, $year) {
                $query->whereHas('salaries', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            }, fn($query) => $query->has('salaries'))
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($officeId, fn($query, $officeId) => $query->where('office_id', $officeId))
            ->when($employmentStatusId, fn($query, $employmentStatusId) => $query->where('employment_status_id', $employmentStatusId))
            ->with(['employmentStatus', 'office', 'latestSalary'])
            ->orderBy('last_name', 'asc')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function getEmployeesForPrint(?int $month, ?int $year): Collection
    {
        return Employee::query()
            ->has('salaries')
            ->when($month && $year, function ($query) use ($month, $year) {
                $query->whereHas('salaries', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            })
            ->with(['office', 'latestSalary'])
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
        $salary = $this->model->findOrFail($id);
        $salary->update($data);
        return $salary;
    }

    public function delete(int $id): bool
    {
        $salary = $this->model->findOrFail($id);
        return $salary->delete();
    }

    public function getByOfficeAndFund(?int $month, ?int $year, ?int $officeId): array
    {
        $periodStart = now()->setDate((int) $year, (int) $month, 1)->startOfMonth();
        $periodEnd = now()->setDate((int) $year, (int) $month, 1)->endOfMonth();

        $sourceOfFundCodes = SourceOfFundCode::where('status', true)
            ->with('generalFund:id,code,description,status')
            ->orderBy('code')
            ->get();

        $generalFundsLookup = GeneralFund::where('status', true)
            ->get()
            ->keyBy('id')
            ->map(fn($gf) => [
                'name' => $gf->description,
                'code' => $gf->code,
                'description' => $gf->description,
            ]);

        $allOffices = Office::orderBy('name')->get(['id', 'name']);
        $offices = $officeId ? $allOffices->where('id', (int) $officeId) : $allOffices;

        $salaryQuery = $this->model->query()
            ->join('employees', 'salaries.employee_id', '=', 'employees.id')
            ->where('salaries.effective_date', '<=', $periodEnd)
            ->where(function ($q) use ($periodStart) {
                $q->whereNull('salaries.end_date')
                    ->orWhere('salaries.end_date', '>=', $periodStart);
            });

        if ($officeId) {
            $salaryQuery->where('employees.office_id', (int) $officeId);
        }

        $salaryData = $salaryQuery
            ->selectRaw('employees.office_id, salaries.source_of_fund_code_id, SUM(salaries.amount) as total_amount, COUNT(DISTINCT salaries.employee_id) as employee_count')
            ->groupBy('employees.office_id', 'salaries.source_of_fund_code_id')
            ->get();

        $officeFundData = $offices->map(function ($office) use ($salaryData, $sourceOfFundCodes, $generalFundsLookup) {
            $officeSalaries = $salaryData->where('office_id', $office->id);
            $funds = [];

            foreach ($officeSalaries as $row) {
                $codeId = $row->source_of_fund_code_id;
                $fundCode = $sourceOfFundCodes->firstWhere('id', $codeId);
                if (!$fundCode) continue;

                $generalFund = $generalFundsLookup->get($fundCode->general_fund_id);
                $funds[] = [
                    'source_of_fund_code_id' => $codeId,
                    'code' => $fundCode->code,
                    'code_description' => $fundCode->description,
                    'general_fund_name' => $generalFund['name'] ?? null,
                    'general_fund_code' => $generalFund['code'] ?? null,
                    'total_amount' => (float) $row->total_amount,
                    'employee_count' => (int) $row->employee_count,
                ];
            }

            usort($funds, fn($a, $b) => $b['total_amount'] <=> $a['total_amount']);

            return [
                'id' => $office->id,
                'name' => $office->name,
                'funds' => $funds,
                'total_amount' => (float) collect($funds)->sum('total_amount'),
            ];
        })->filter(fn($office) => $office['total_amount'] > 0)->values();

        return [
            'offices' => $officeFundData,
            'allOffices' => $allOffices,
            'sourceOfFundCodes' => $sourceOfFundCodes->map(fn($c) => [
                'id' => $c->id,
                'code' => $c->code,
                'description' => $c->description,
            ]),
            'summary' => [
                'total_offices' => $officeFundData->count(),
                'total_fund_codes' => $sourceOfFundCodes->count(),
                'total_amount' => (float) $officeFundData->sum('total_amount'),
            ],
        ];
    }
}
