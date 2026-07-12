<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\DeductionTypeRepositoryInterface;
use App\Contracts\Repositories\DeductionCategoryRepositoryInterface;
use App\Models\DeductionType;
use App\Models\DeductionCategory;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeductionTypeController extends Controller
{
    use HandlesDeletionRequests;

    public function __construct(
        private readonly DeductionTypeRepositoryInterface $deductionTypeRepo,
        private readonly DeductionCategoryRepositoryInterface $deductionCategoryRepo
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', DeductionType::class);
        $search = $request->input('search');

        $deductionTypes = $this->deductionTypeRepo->getAllPaginated($search);
        $categories = $this->deductionCategoryRepo->getAll()->map(fn($c) => ['id' => $c->id, 'name' => $c->name])->toArray();

        return Inertia::render('deduction-types/index', [
            'deductionTypes' => $deductionTypes,
            'categories' => $categories,
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

        $this->deductionTypeRepo->create($validated);

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

        $this->deductionTypeRepo->update($deductionType->id, $validated);

        return redirect()->back()->with('success', 'Deduction type updated successfully');
    }

    public function destroy(DeductionType $deductionType)
    {
        if ($this->deductionTypeRepo->hasEmployeeDeductions($deductionType->id)) {
            return redirect()->back()->with('error', 'Cannot delete deduction type that has existing employee deductions.');
        }

        return $this->handleDeletion($deductionType, 'deduction_types.delete');
    }
}
