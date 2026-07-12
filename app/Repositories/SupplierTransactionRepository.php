<?php

namespace App\Repositories;

use App\Contracts\Repositories\SupplierTransactionRepositoryInterface;
use App\Models\SupplierTransaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class SupplierTransactionRepository implements SupplierTransactionRepositoryInterface
{
    public function __construct(protected SupplierTransaction $model) {}

    public function getSupplierTransactions(int $supplierId, ?string $search = null, ?int $year = null, ?int $month = null, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->where('supplier_id', $supplierId)
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('pr_no', 'like', "%{$search}%")
                        ->orWhere('po_no', 'like', "%{$search}%")
                        ->orWhere('sale_invoice_no', 'like', "%{$search}%")
                        ->orWhere('or_no', 'like', "%{$search}%")
                        ->orWhere('dr_no', 'like', "%{$search}%")
                        ->orWhere('particulars', 'like', "%{$search}%")
                        ->orWhere('earmark', 'like', "%{$search}%");
                });
            })
            ->when($year, fn($q, $year) => $q->whereYear('pr_date', $year))
            ->when($month, fn($q, $month) => $q->whereMonth('pr_date', $month))
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function getSupplierTransactionsReport(int $supplierId, ?string $search = null, ?int $year = null, ?int $month = null): Collection
    {
        return $this->model->where('supplier_id', $supplierId)
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('pr_no', 'like', "%{$search}%")
                        ->orWhere('po_no', 'like', "%{$search}%")
                        ->orWhere('sale_invoice_no', 'like', "%{$search}%")
                        ->orWhere('or_no', 'like', "%{$search}%")
                        ->orWhere('dr_no', 'like', "%{$search}%")
                        ->orWhere('particulars', 'like', "%{$search}%")
                        ->orWhere('earmark', 'like', "%{$search}%");
                });
            })
            ->when($year, fn($q, $year) => $q->whereYear('pr_date', $year))
            ->when($month, fn($q, $month) => $q->whereMonth('pr_date', $month))
            ->orderBy('pr_date', 'desc')
            ->get();
    }

    public function getYearOptions(int $supplierId): array
    {
        return $this->model->where('supplier_id', $supplierId)
            ->whereNotNull('pr_date')
            ->selectRaw('DISTINCT YEAR(pr_date) as year')
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->values()
            ->all();
    }

    public function findById(int $id): ?Model
    {
        return $this->model->find($id);
    }

    public function create(int $supplierId, array $data): Model
    {
        return $this->model->create(array_merge($data, ['supplier_id' => $supplierId]));
    }

    public function update(int $id, array $data): Model
    {
        $transaction = $this->model->findOrFail($id);
        $transaction->update($data);
        return $transaction;
    }

    public function delete(int $id): bool
    {
        $transaction = $this->model->findOrFail($id);
        return $transaction->delete();
    }
}
