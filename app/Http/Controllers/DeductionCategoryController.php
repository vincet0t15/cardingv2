<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\DeductionCategoryRepositoryInterface;
use App\Models\DeductionCategory;
use App\Models\DeductionType;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeductionCategoryController extends Controller
{
    use HandlesDeletionRequests;

    public function __construct(
        private readonly DeductionCategoryRepositoryInterface $deductionCategoryRepo
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', DeductionCategory::class);
        $search = $request->input('search');

        $categories = $this->deductionCategoryRepo->getAllPaginated($search);
        $uncategorized = $this->deductionCategoryRepo->getUncategorizedTypes();
        $allCategories = $this->deductionCategoryRepo->getAll()->map(fn($c) => ['id' => $c->id, 'name' => $c->name])->toArray();

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

        $this->deductionCategoryRepo->create($validated);

        return redirect()->back()->with('success', 'Category created successfully');
    }

    public function update(Request $request, DeductionCategory $deductionCategory)
    {
        $this->authorize('update', $deductionCategory);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:deduction_categories,name,' . $deductionCategory->id,
        ]);

        $this->deductionCategoryRepo->update($deductionCategory->id, $validated);

        return redirect()->back()->with('success', 'Category updated successfully');
    }

    public function destroy(DeductionCategory $deductionCategory)
    {
        if ($this->deductionCategoryRepo->hasDeductionTypes($deductionCategory->id)) {
            return redirect()->back()->with('error', 'Cannot delete category that has associated deduction types.');
        }

        return $this->handleDeletion($deductionCategory, 'deduction_categories.delete');
    }
}
