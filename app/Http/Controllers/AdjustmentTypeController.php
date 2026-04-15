<?php

namespace App\Http\Controllers;

use App\Models\AdjustmentType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdjustmentTypeController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', AdjustmentType::class);

        $search = $request->input('search');
        $adjustmentTypes = AdjustmentType::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('settings/AdjustmentType/index', [
            'adjustmentTypes' => $adjustmentTypes,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', AdjustmentType::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:adjustment_types,name',
            'description' => 'nullable|string|max:1000',
            'effect' => 'required|in:positive,negative',
            'taxable' => 'sometimes|boolean',
            'include_in_payroll' => 'sometimes|boolean',
            'requires_approval' => 'sometimes|boolean',
            'restricted_roles' => 'sometimes|array',
            'restricted_roles.*' => 'string|exists:roles,name',
        ]);

        AdjustmentType::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'effect' => $validated['effect'],
            'taxable' => $validated['taxable'] ?? false,
            'include_in_payroll' => $validated['include_in_payroll'] ?? false,
            'requires_approval' => $validated['requires_approval'] ?? true,
            'restricted_roles' => isset($validated['restricted_roles']) ? implode(',', $validated['restricted_roles']) : null,
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Adjustment Type created successfully.');
    }

    public function update(Request $request, AdjustmentType $adjustmentType)
    {
        $this->authorize('update', $adjustmentType);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:adjustment_types,name,' . $adjustmentType->id,
            'description' => 'nullable|string|max:1000',
            'effect' => 'required|in:positive,negative',
            'taxable' => 'sometimes|boolean',
            'include_in_payroll' => 'sometimes|boolean',
            'requires_approval' => 'sometimes|boolean',
            'restricted_roles' => 'sometimes|array',
            'restricted_roles.*' => 'string|exists:roles,name',
        ]);

        $adjustmentType->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'effect' => $validated['effect'],
            'taxable' => $validated['taxable'] ?? false,
            'include_in_payroll' => $validated['include_in_payroll'] ?? false,
            'requires_approval' => $validated['requires_approval'] ?? true,
            'restricted_roles' => isset($validated['restricted_roles']) ? implode(',', $validated['restricted_roles']) : null,
        ]);

        return redirect()->back()->with('success', 'Adjustment Type updated successfully.');
    }

    public function destroy(AdjustmentType $adjustmentType)
    {
        $this->authorize('delete', $adjustmentType);

        if ($adjustmentType->adjustments()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete adjustment type that has adjustments assigned.');
        }

        $adjustmentType->delete();

        return redirect()->back()->with('success', 'Adjustment Type deleted successfully.');
    }
}
