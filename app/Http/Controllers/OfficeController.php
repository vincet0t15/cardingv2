<?php

namespace App\Http\Controllers;

use App\Models\DeleteRequest;
use App\Models\Notification;
use App\Models\Office;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class OfficeController extends Controller
{
    use HandlesDeletionRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Office::class);
        $search = $request->input('search');

        // Get pending delete requests for current user
        $pendingDeleteRequests = DeleteRequest::where('status', DeleteRequest::STATUS_PENDING)
            ->where('requested_by', Auth::id())
            ->get()
            ->keyBy('requestable_id');

        $offices = Office::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->paginate(50)
            ->withQueryString()
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

    public function destroy(Request $request, $id)
    {
        $office = Office::findOrFail($id);

        if ($office->employees()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete office that has employees assigned.');
        }

        return $this->handleDeletion($office, 'offices.delete');
    }
}
