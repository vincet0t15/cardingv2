<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\ReferenceTypeRepositoryInterface;
use App\Models\ReferenceType;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReferenceTypeController extends Controller
{
    use HandlesDeletionRequests;

    public function __construct(
        private readonly ReferenceTypeRepositoryInterface $referenceTypeRepo
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', ReferenceType::class);

        $search = $request->input('search');
        $referenceTypes = $this->referenceTypeRepo->getAllPaginated($search);

        return Inertia::render('settings/ReferenceType/index', [
            'referenceTypes' => $referenceTypes,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', ReferenceType::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:reference_types,name',
            'description' => 'nullable|string|max:1000',
        ]);

        $this->referenceTypeRepo->create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Reference Type created successfully.');
    }

    public function update(Request $request, ReferenceType $referenceType)
    {
        $this->authorize('update', $referenceType);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:reference_types,name,' . $referenceType->id,
            'description' => 'nullable|string|max:1000',
        ]);

        $this->referenceTypeRepo->update($referenceType->id, [
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Reference Type updated successfully.');
    }

    public function destroy(ReferenceType $referenceType)
    {
        if ($this->referenceTypeRepo->hasAdjustments($referenceType->id)) {
            return redirect()->back()->with('error', 'Cannot delete reference type that has adjustments assigned.');
        }

        return $this->handleDeletion($referenceType, 'reference_types.delete');
    }
}
