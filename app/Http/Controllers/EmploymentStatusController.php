<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\EmploymentStatusRepositoryInterface;
use App\Models\EmploymentStatus;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmploymentStatusController extends Controller
{
    use HandlesDeletionRequests;

    public function __construct(
        private readonly EmploymentStatusRepositoryInterface $employmentStatusRepo
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', EmploymentStatus::class);
        $search = $request->input('search');
        $employmentStatuses = $this->employmentStatusRepo->getAllPaginated($search);

        return Inertia::render('settings/EmploymentStatus/index', [
            'employmentStatuses' => $employmentStatuses,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', EmploymentStatus::class);
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:employment_statuses,name',
        ]);

        $this->employmentStatusRepo->create(['name' => $validated['name']]);

        return redirect()->back()->with('success', 'Employment Status created successfully.');
    }

    public function update(Request $request, EmploymentStatus $employmentStatus)
    {
        $this->authorize('update', $employmentStatus);
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:employment_statuses,name,' . $employmentStatus->id,
        ]);

        $this->employmentStatusRepo->update($employmentStatus->id, ['name' => $validated['name']]);

        return redirect()->back()->with('success', 'Employment Status updated successfully.');
    }

    public function destroy(EmploymentStatus $employmentStatus)
    {
        if ($this->employmentStatusRepo->hasEmployees($employmentStatus->id)) {
            return redirect()->back()->with('error', 'Cannot delete employment status that has employees assigned.');
        }

        return $this->handleDeletion($employmentStatus, 'employment_statuses.delete');
    }
}
