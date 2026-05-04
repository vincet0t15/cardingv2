<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\SupplierTransaction;
use App\Traits\HandlesDeletionRequests;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SupplierTransactionController extends Controller
{
    use HandlesDeletionRequests;
    /**
     * Display the supplier's transactions.
     */
    public function show(Request $request, Supplier $supplier): Response
    {
        $query = SupplierTransaction::where('supplier_id', $supplier->id);
        $search = $request->input('search');
        $year = $request->input('year');
        $month = $request->input('month');

        if ($search) {
            $query->where(function ($query) use ($search) {
                $query->where('pr_no', 'like', "%{$search}%")
                    ->orWhere('po_no', 'like', "%{$search}%")
                    ->orWhere('sale_invoice_no', 'like', "%{$search}%")
                    ->orWhere('or_no', 'like', "%{$search}%")
                    ->orWhere('dr_no', 'like', "%{$search}%")
                    ->orWhere('particulars', 'like', "%{$search}%")
                    ->orWhere('earmark', 'like', "%{$search}%");
            });
        }

        if ($year) {
            $query->whereYear('pr_date', $year);
        }

        if ($month) {
            $query->whereMonth('pr_date', $month);
        }

        $transactions = $query->orderBy('pr_date', 'desc')->paginate(15);

        $yearOptions = SupplierTransaction::where('supplier_id', $supplier->id)
            ->whereNotNull('pr_date')
            ->orderBy('pr_date', 'desc')
            ->pluck('pr_date')
            ->map(fn($date) => Carbon::parse($date)->year)
            ->unique()
            ->sortDesc()
            ->values()
            ->all();

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
        $query = SupplierTransaction::where('supplier_id', $supplier->id);
        $search = $request->input('search');
        $year = $request->input('year');
        $month = $request->input('month');

        if ($search) {
            $query->where(function ($query) use ($search) {
                $query->where('pr_no', 'like', "%{$search}%")
                    ->orWhere('po_no', 'like', "%{$search}%")
                    ->orWhere('sale_invoice_no', 'like', "%{$search}%")
                    ->orWhere('or_no', 'like', "%{$search}%")
                    ->orWhere('dr_no', 'like', "%{$search}%")
                    ->orWhere('particulars', 'like', "%{$search}%")
                    ->orWhere('earmark', 'like', "%{$search}%");
            });
        }

        if ($year) {
            $query->whereYear('pr_date', $year);
        }

        if ($month) {
            $query->whereMonth('pr_date', $month);
        }

        $transactions = $query->orderBy('pr_date', 'desc')->get();

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

        $supplier->transactions()->create($validated);

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

        $transaction->update($validated);

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
