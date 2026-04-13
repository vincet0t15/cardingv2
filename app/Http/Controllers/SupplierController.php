<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    /**
     * Display a listing of suppliers.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Supplier::class);
        $search = $request->input('search');

        $suppliers = Supplier::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('suppliers/index', [
            'suppliers' => $suppliers,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created supplier.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Supplier::class);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'contact_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'remarks' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        Supplier::create($validated);

        return redirect()->route('suppliers.index')->with('success', 'Supplier created successfully.');
    }

    /**
     * Update the specified supplier.
     */
    public function update(Request $request, Supplier $supplier)
    {
        $this->authorize('update', $supplier);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'contact_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'remarks' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $supplier->update($validated);

        return redirect()->route('suppliers.index')->with('success', 'Supplier updated successfully.');
    }

    /**
     * Remove the specified supplier.
     */
    public function destroy(Supplier $supplier)
    {
        $this->authorize('delete', $supplier);
        $supplier->delete();

        return redirect()->route('suppliers.index')->with('success', 'Supplier deleted successfully.');
    }
}
