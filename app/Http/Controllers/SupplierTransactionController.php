<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\SupplierTransactionRepositoryInterface;
use App\Models\Supplier;
use App\Models\SupplierTransaction;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SupplierTransactionController extends Controller
{
    use HandlesDeletionRequests;

    public function __construct(
        private readonly SupplierTransactionRepositoryInterface $supplierTransactionRepo
    ) {}

    /**
     * Display the supplier's transactions.
     */
    public function show(Request $request, Supplier $supplier): Response
    {
        $search = $request->input('search');
        $year = $request->input('year');
        $month = $request->input('month');

        $transactions = $this->supplierTransactionRepo->getSupplierTransactions($supplier->id, $search, $year, $month);
        $yearOptions = $this->supplierTransactionRepo->getYearOptions($supplier->id);

        return Inertia::render('suppliers/show', [
            'supplier' => $supplier,
            'transactions' => $transactions,
            'search' => $search,
            'year' => $year,
            'month' => $month,
            'years' => $yearOptions,
        ]);
    }

    /**
     * Display the supplier's transaction report.
     */
    public function report(Request $request, Supplier $supplier): Response
    {
        $search = $request->input('search');
        $year = $request->input('year');
        $month = $request->input('month');

        $transactions = $this->supplierTransactionRepo->getSupplierTransactionsReport($supplier->id, $search, $year, $month);

        return Inertia::render('suppliers/transaction-report', [
            'supplier' => $supplier,
            'transactions' => $transactions,
            'search' => $search,
            'year' => $year,
            'month' => $month,
        ]);
    }

    /**
     * Store a newly created transaction.
     */
    public function store(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'pr_date' => 'required|date',
            'pr_no' => [
                'required',
                'string',
                'max:255',
                Rule::unique('supplier_transactions')
                    ->where('supplier_id', $supplier->id)
                    ->where('earmark', $request->input('earmark')),
            ],
            'po_date' => 'nullable|date',
            'po_no' => 'nullable|string|max:255',
            'sale_invoice_date' => 'nullable|date',
            'sale_invoice_no' => 'nullable|string|max:255',
            'or_date' => 'nullable|date',
            'or_no' => 'nullable|string|max:255',
            'dr_date' => 'nullable|date',
            'dr_no' => 'nullable|string|max:255',
            'qty_period_covered' => 'nullable|string|max:255',
            'particulars' => 'required|string',
            'gross' => 'required|numeric|min:0',
            'ewt' => 'nullable|numeric|min:0',
            'vat' => 'nullable|numeric|min:0',
            'net_amount' => 'required|numeric|min:0',
            'date_processed' => 'nullable|date',
            'remarks' => 'nullable|string',
            'earmark' => 'nullable|string|max:255',
        ]);

        $this->supplierTransactionRepo->create($supplier->id, $validated);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Transaction added successfully.'], 201);
        }

        return redirect()->route('suppliers.transactions.show', $supplier)
            ->with('success', 'Transaction added successfully.');
    }

    /**
     * Update the specified transaction.
     */
    public function update(Request $request, Supplier $supplier, SupplierTransaction $transaction)
    {
        $validated = $request->validate([
            'pr_date' => 'required|date',
            'pr_no' => [
                'required',
                'string',
                'max:255',
                Rule::unique('supplier_transactions')
                    ->where('supplier_id', $supplier->id)
                    ->where('earmark', $request->input('earmark'))
                    ->ignore($transaction->id),
            ],
            'po_date' => 'nullable|date',
            'po_no' => 'nullable|string|max:255',
            'sale_invoice_date' => 'nullable|date',
            'sale_invoice_no' => 'nullable|string|max:255',
            'or_date' => 'nullable|date',
            'or_no' => 'nullable|string|max:255',
            'dr_date' => 'nullable|date',
            'dr_no' => 'nullable|string|max:255',
            'qty_period_covered' => 'nullable|string|max:255',
            'particulars' => 'required|string',
            'gross' => 'required|numeric|min:0',
            'ewt' => 'nullable|numeric|min:0',
            'vat' => 'nullable|numeric|min:0',
            'net_amount' => 'required|numeric|min:0',
            'date_processed' => 'nullable|date',
            'remarks' => 'nullable|string',
            'earmark' => 'nullable|string|max:255',
        ]);

        $this->supplierTransactionRepo->update($transaction->id, $validated);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Transaction updated successfully.']);
        }

        return redirect()->route('suppliers.transactions.show', $supplier)
            ->with('success', 'Transaction updated successfully.');
    }

    /**
     * Delete the specified transaction.
     */
    public function destroy(Supplier $supplier, SupplierTransaction $transaction)
    {
        return $this->handleDeletion($transaction, 'suppliers.manage');
    }

    /**
     * Print a single transaction as invoice.
     */
    public function print(Supplier $supplier, SupplierTransaction $transaction): Response
    {
        return Inertia::render('suppliers/print-transaction', [
            'supplier' => $supplier,
            'transaction' => $transaction,
        ]);
    }
}
