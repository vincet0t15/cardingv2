<?php

namespace App\Http\Controllers;

use App\Models\ClaimType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClaimTypeController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', ClaimType::class);
        $search = $request->query('search');
        $claimTypes = ClaimType::query()
            ->when($search, function ($query) use ($search) {
                $query->where('name', 'like', '%' . $search . '%')
                    ->orWhere('code', 'like', '%' . $search . '%');
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

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

        ClaimType::create($validated);

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

        $claimType->update($validated);

        return redirect()->back()->with('success', 'Claim type updated successfully');
    }

    public function destroy(ClaimType $claimType)
    {
        $this->authorize('delete', $claimType);
        if ($claimType->claims()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete claim type with existing claims');
        }

        $claimType->delete();

        return redirect()->back()->with('success', 'Claim type deleted successfully');
    }
}
