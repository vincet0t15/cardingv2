<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\ClaimTypeRepositoryInterface;
use App\Models\ClaimType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClaimTypeController extends Controller
{
    public function __construct(
        private readonly ClaimTypeRepositoryInterface $claimTypeRepo
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', ClaimType::class);
        $search = $request->query('search');
        $claimTypes = $this->claimTypeRepo->getAllPaginated($search);

        return Inertia::render('claim-types/index', [
            'claimTypes' => $claimTypes,
            'filters' => [
                'search' => $search,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', ClaimType::class);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:claim_types,code',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $this->claimTypeRepo->create($validated);

        return redirect()->back()->with('success', 'Claim type created successfully');
    }

    public function update(Request $request, ClaimType $claimType)
    {
        $this->authorize('update', $claimType);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:claim_types,code,' . $claimType->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $this->claimTypeRepo->update($claimType->id, $validated);

        return redirect()->back()->with('success', 'Claim type updated successfully');
    }

    public function destroy(ClaimType $claimType)
    {
        $this->authorize('delete', $claimType);

        if ($this->claimTypeRepo->hasClaims($claimType->id)) {
            return redirect()->back()->with('error', 'Cannot delete claim type with existing claims');
        }

        $this->claimTypeRepo->delete($claimType->id);

        return redirect()->back()->with('success', 'Claim type deleted successfully');
    }
}
