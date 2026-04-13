<?php

namespace App\Http\Controllers;

use App\Models\EmploymentStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmploymentStatusController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $employmentStatuses = EmploymentStatus::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('settings/EmploymentStatus/index', [
            'employmentStatuses' => $employmentStatuses,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:employment_statuses,name',
        ]);

        EmploymentStatus::create(['name' => $validated['name']]);

        return redirect()->back()->with('success', 'Employment Status created successfully.');
    }

    public function update(Request $request, EmploymentStatus $employmentStatus)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:employment_statuses,name,'.$employmentStatus->id,
        ]);

        $employmentStatus->update(['name' => $validated['name']]);

        return redirect()->back()->with('success', 'Employment Status updated successfully.');
    }

    public function destroy(EmploymentStatus $employmentStatus)
    {
        if ($employmentStatus->employees()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete employment status that has employees assigned.');
        }

        $employmentStatus->delete();

        return redirect()->back()->with('success', 'Employment Status deleted successfully.');
    }
}
