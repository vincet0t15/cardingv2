<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\GeneralFundRepositoryInterface;
use App\Models\GeneralFund;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GeneralFundController extends Controller
{
    use HandlesDeletionRequests;

    public function __construct(
        private readonly GeneralFundRepositoryInterface $generalFundRepo
    ) {}

    public function index(Request $request)
    {
        $search = $request->input('search');
        $generalFunds = $this->generalFundRepo->getAllPaginated($search);

        return Inertia::render('GeneralFund/index', [
            'generalFunds' => $generalFunds,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:general_funds,code',
            'description' => 'nullable|string|max:255',
            'status' => 'boolean',
        ]);

        $this->generalFundRepo->create($validated);

        return redirect()->back()->with('success', 'General Fund created successfully.');
    }

    public function update(Request $request, GeneralFund $generalFund)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:general_funds,code,' . $generalFund->id,
            'description' => 'nullable|string|max:255',
            'status' => 'boolean',
        ]);

        $this->generalFundRepo->update($generalFund->id, $validated);

        return redirect()->back()->with('success', 'General Fund updated successfully.');
    }

    public function destroy(GeneralFund $generalFund)
    {
        if ($this->generalFundRepo->hasSourceOfFundCodes($generalFund->id)) {
            return redirect()->back()->with('error', 'Cannot delete General Fund that has source of fund codes assigned.');
        }

        return $this->handleDeletion($generalFund, 'general_funds.delete');
    }
}
