<?php

namespace App\Http\Controllers;

use App\Models\DeductionType;
use App\Models\DeductionCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeductionTypeController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', DeductionType::class);
        $search = $request->input('search');

        $deductionTypes = DeductionType::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('deduction-types/index', [
            'deductionTypes' => $deductionTypes,
            'categories' => DeductionCategory::orderBy('name')->get()->map(function ($c) {
                return ['id' => $c->id, 'name' => $c->name];
            })->toArray(),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', DeductionType::class);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:deduction_types,code',
            'category_id' => 'nullable|exists:deduction_categories,id',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        DeductionType::create($validated);

        return redirect()->back()->with('success', 'Deduction type created successfully');
    }

    public function update(Request $request, DeductionType $deductionType)
    {
        $this->authorize('update', $deductionType);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:deduction_types,code,' . $deductionType->id,
            'category_id' => 'nullable|exists:deduction_categories,id',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $deductionType->update($validated);

        return redirect()->back()->with('success', 'Deduction type updated successfully');
    }

    public function destroy(DeductionType $deductionType)
    {
        $this->authorize('delete', $deductionType);
        if ($deductionType->employeeDeductions()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete deduction type that has existing employee deductions.');
        }

        $deductionType->delete();

        return redirect()->back()->with('success', 'Deduction type deleted successfully');
    }
}
