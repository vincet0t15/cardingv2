<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\SourceOfFundCodeRepositoryInterface;
use App\Contracts\Repositories\GeneralFundRepositoryInterface;
use App\Models\GeneralFund;
use App\Models\SourceOfFundCode;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SourceOfFundCodeController extends Controller
{
    use HandlesDeletionRequests;

    public function __construct(
        private readonly SourceOfFundCodeRepositoryInterface $sourceOfFundCodeRepo,
        private readonly GeneralFundRepositoryInterface $generalFundRepo
    ) {}

    public function index(Request $request)
    {
        $search = $request->input('search');

        $sourceOfFundCodes = $this->sourceOfFundCodeRepo->getAllPaginated($search);
        $categories = $this->sourceOfFundCodeRepo->getCategories();
        $generalFunds = $this->generalFundRepo->getActive();

        return Inertia::render('SourceOfFundCode/index', [
            'sourceOfFundCodes' => $sourceOfFundCodes,
            'categories' => $categories,
            'generalFunds' => $generalFunds,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:source_of_fund_codes,code',
            'description' => 'nullable|string|max:255',
            'status' => 'boolean',
            'parent_id' => 'nullable|exists:source_of_fund_codes,id',
            'is_category' => 'boolean',
            'general_fund_id' => 'nullable|exists:general_funds,id',
        ]);

        if (! isset($validated['parent_id'])) {
            $validated['parent_id'] = null;
        }
        if (! isset($validated['is_category'])) {
            $validated['is_category'] = false;
        }
        if (! isset($validated['general_fund_id'])) {
            $validated['general_fund_id'] = null;
        }

        $this->sourceOfFundCodeRepo->create($validated);

        return redirect()->back()->with('success', 'Source of fund code created successfully.');
    }

    public function update(Request $request, SourceOfFundCode $sourceOfFundCode)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:source_of_fund_codes,code,' . $sourceOfFundCode->id,
            'description' => 'nullable|string|max:255',
            'status' => 'boolean',
            'parent_id' => 'nullable|exists:source_of_fund_codes,id',
            'is_category' => 'boolean',
            'general_fund_id' => 'nullable|exists:general_funds,id',
        ]);

        if (! isset($validated['parent_id'])) {
            $validated['parent_id'] = null;
        }
        if (! isset($validated['is_category'])) {
            $validated['is_category'] = false;
        }
        if (! isset($validated['general_fund_id'])) {
            $validated['general_fund_id'] = null;
        }

        $this->sourceOfFundCodeRepo->update($sourceOfFundCode->id, $validated);

        return redirect()->back()->with('success', 'Source of fund code updated successfully.');
    }

    public function destroy(SourceOfFundCode $sourceOfFundCode)
    {
        if ($this->sourceOfFundCodeRepo->hasSalaries($sourceOfFundCode->id)) {
            return redirect()->back()->with('error', 'Cannot delete source of fund code that has salary records.');
        }

        if ($this->sourceOfFundCodeRepo->hasChildren($sourceOfFundCode->id)) {
            return redirect()->back()->with('error', 'Cannot delete source of fund code that has child codes. Delete child codes first.');
        }

        return $this->handleDeletion($sourceOfFundCode, 'source_of_fund_codes.delete');
    }

    public function edit(SourceOfFundCode $sourceOfFundCode)
    {
        return Inertia::render('SourceOfFundCode/index', [
            'editSourceOfFundCode' => $sourceOfFundCode,
        ]);
    }
}
