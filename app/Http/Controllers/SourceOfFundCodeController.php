<?php

namespace App\Http\Controllers;

use App\Models\GeneralFund;
use App\Models\SourceOfFundCode;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SourceOfFundCodeController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $sourceOfFundCodes = SourceOfFundCode::with(['parent', 'generalFund'])
            ->when($search, function ($query, $search) {
                $query->where('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->orderByRaw('CASE WHEN is_category = 1 THEN 0 ELSE 1 END')
            ->orderBy('code')
            ->paginate(50)
            ->withQueryString();

        $categories = SourceOfFundCode::where('is_category', true)
            ->orderBy('code')
            ->get();

        $generalFunds = GeneralFund::where('status', true)
            ->orderBy('code')
            ->get();

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

        SourceOfFundCode::create($validated);

        return redirect()->back()->with('success', 'Source of fund code created successfully.');
    }

    public function update(Request $request, SourceOfFundCode $sourceOfFundCode)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:source_of_fund_codes,code,'.$sourceOfFundCode->id,
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

        $sourceOfFundCode->update($validated);

        return redirect()->back()->with('success', 'Source of fund code updated successfully.');
    }

    public function destroy(SourceOfFundCode $sourceOfFundCode)
    {
        if ($sourceOfFundCode->salaries()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete source of fund code that has salary records.');
        }

        if ($sourceOfFundCode->children()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete source of fund code that has child codes. Delete child codes first.');
        }

        $sourceOfFundCode->delete();

        return redirect()->back()->with('success', 'Source of fund code deleted successfully.');
    }

    public function edit(SourceOfFundCode $sourceOfFundCode)
    {
        return Inertia::render('SourceOfFundCode/index', [
            'editSourceOfFundCode' => $sourceOfFundCode,
        ]);
    }
}
