<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\OfficeRepositoryInterface;
use App\Contracts\Repositories\DeleteRequestRepositoryInterface;
use App\Models\DeleteRequest;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class OfficeController extends Controller
{
    use HandlesDeletionRequests;

    public function __construct(
        private readonly OfficeRepositoryInterface $officeRepo,
        private readonly DeleteRequestRepositoryInterface $deleteRequestRepo
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', \App\Models\Office::class);
        $search = $request->input('search');

        $pendingDeleteRequests = $this->deleteRequestRepo->getPendingForUser(Auth::id());

        $offices = $this->officeRepo->getAllPaginated($search)
            ->through(function ($office) use ($pendingDeleteRequests) {
                $office->deleteRequest = $pendingDeleteRequests->get($office->id);
                return $office;
            });

        return Inertia::render('settings/offices/index', [
            'offices' => $offices,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', \App\Models\Office::class);
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:offices,name',
            'code' => 'required|string|max:255|unique:offices,code',
        ]);

        $this->officeRepo->create($validated);

        return redirect()->back()->with('success', 'Office created successfully.');
    }

    public function update(Request $request, \App\Models\Office $office)
    {
        $this->authorize('update', $office);
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:offices,name,' . $office->id,
            'code' => 'required|string|max:255|unique:offices,code,' . $office->id,
        ]);

        $this->officeRepo->update($office->id, $validated);

        return redirect()->back()->with('success', 'Office updated successfully.');
    }

    public function destroy(Request $request, $id)
    {
        $office = $this->officeRepo->findById($id);

        if ($this->officeRepo->hasEmployees($id)) {
            return redirect()->back()->with('error', 'Cannot delete office that has employees assigned.');
        }

        return $this->handleDeletion($office, 'offices.delete');
    }
}
