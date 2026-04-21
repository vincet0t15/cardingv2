<?php

namespace App\Http\Controllers;

use App\Models\ReferenceType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ReferenceTypeController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', ReferenceType::class);

        $search = $request->input('search');
        $referenceTypes = ReferenceType::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

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

        ReferenceType::create([
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

        $referenceType->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Reference Type updated successfully.');
    }

    public function destroy(ReferenceType $referenceType)
    {
        $this->authorize('delete', $referenceType);

        if ($referenceType->adjustments()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete reference type that has adjustments assigned.');
        }

        $referenceType->delete();

        return redirect()->back()->with('success', 'Reference Type deleted successfully.');
    }
}
