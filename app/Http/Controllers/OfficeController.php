<?php

namespace App\Http\Controllers;

use App\Models\Office;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OfficeController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Office::class);
        $search = $request->input('search');
        $offices = Office::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('settings/offices/index', [
            'offices' => $offices,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Office::class);
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:offices,name',
            'code' => 'required|string|max:255|unique:offices,code',
        ]);

        Office::create($validated);

        return redirect()->back()->with('success', 'Office created successfully.');
    }

    public function update(Request $request, Office $office)
    {
        $this->authorize('update', $office);
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:offices,name,' . $office->id,
            'code' => 'required|string|max:255|unique:offices,code,' . $office->id,
        ]);

        $office->update($validated);

        return redirect()->back()->with('success', 'Office updated successfully.');
    }

    public function destroy(Request $request, Office $office)
    {
        $this->authorize('delete', $office);
        if ($office->employees()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete office that has employees assigned.');
        }

        $office->delete();

        return redirect()->back()->with('success', 'Office deleted successfully.');
    }
}
