<?php

namespace App\Http\Controllers;

use App\Models\DeductionCategory;
use App\Models\DeductionType;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeductionCategoryController extends Controller
{
    use HandlesDeletionRequests;
    public function index(Request $request)
    {
        $this->authorize('viewAny', DeductionCategory::class);
        $search = $request->input('search');

        $categories = DeductionCategory::query()
            ->with('deductionTypes')
            ->when($search, function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(50)
            ->withQueryString();

        $uncategorized = DeductionType::query()
            ->whereNull('category_id')
            ->orderBy('name')
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'name' => $t->name,
                    'code' => $t->code,
                    'is_active' => (bool) $t->is_active,
                    'category_id' => $t->category_id,
                ];
            })->toArray();

        $allCategories = DeductionCategory::orderBy('name')->get()->map(function ($c) {
            return ['id' => $c->id, 'name' => $c->name];
        })->toArray();

        return Inertia::render('deduction-categories/index', [
            'categories' => $categories,
            'uncategorizedTypes' => $uncategorized,
            'allCategories' => $allCategories,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', DeductionCategory::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:deduction_categories,name',
        ]);

        DeductionCategory::create($validated);

        return redirect()->back()->with('success', 'Category created successfully');
    }

    public function update(Request $request, DeductionCategory $deductionCategory)
    {
        $this->authorize('update', $deductionCategory);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:deduction_categories,name,' . $deductionCategory->id,
        ]);

        $deductionCategory->update($validated);

        return redirect()->back()->with('success', 'Category updated successfully');
    }

    public function destroy(DeductionCategory $deductionCategory)
    {
        if ($deductionCategory->deductionTypes()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete category that has associated deduction types.');
        }

        return $this->handleDeletion($deductionCategory, 'deduction-categories.delete');
    }
}
