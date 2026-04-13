<?php

namespace App\Http\Controllers;

use App\Models\ClothingAllowance;
use App\Models\Employee;
use App\Models\SourceOfFundCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClothingAllowanceController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', ClothingAllowance::class);
        $search = $request->input('search');
        $officeId = $request->input('office_id');
        $employmentStatusId = $request->input('employment_status_id');

        $employees = Employee::query()
            ->when($search, function ($query, $search) {
                $query->where('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            })
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($employmentStatusId, function ($query, $employmentStatusId) {
                $query->where('employment_status_id', $employmentStatusId);
            })
            ->with(['employmentStatus', 'office', 'latestClothingAllowance'])
            ->orderBy('last_name', 'asc')
            ->paginate(50)
            ->withQueryString();

        $sourceOfFundCodes = SourceOfFundCode::where('status', true)->orderBy('code')->get();

        return Inertia::render('clothing-allowances/index', [
            'employees' => $employees,
            'sourceOfFundCodes' => $sourceOfFundCodes,
            'filters' => [
                'search' => $search,
                'office_id' => $officeId,
                'employment_status_id' => $employmentStatusId,
            ],
        ]);
    }

    public function history(Request $request, Employee $employee)
    {
        $this->authorize('viewAny', ClothingAllowance::class);
        $clothingAllowances = $employee->clothingAllowances()
            ->with('createdBy')
            ->orderBy('effective_date', 'desc')
            ->get();

        return Inertia::render('clothing-allowances/history', [
            'employee' => $employee->load(['employmentStatus', 'office']),
            'clothingAllowances' => $clothingAllowances,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', ClothingAllowance::class);
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'source_of_fund_code_id' => 'nullable|exists:source_of_fund_codes,id',
        ]);

        ClothingAllowance::create([
            'employee_id' => $validated['employee_id'],
            'amount' => $validated['amount'],
            'effective_date' => $validated['effective_date'],
            'source_of_fund_code_id' => $validated['source_of_fund_code_id'] ?? null,
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Clothing Allowance added successfully');
    }

    public function update(Request $request, ClothingAllowance $clothingAllowance)
    {
        $this->authorize('update', $clothingAllowance);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'source_of_fund_code_id' => 'nullable|exists:source_of_fund_codes,id',
        ]);

        $clothingAllowance->update([
            'amount' => $validated['amount'],
            'effective_date' => $validated['effective_date'],
            'source_of_fund_code_id' => $validated['source_of_fund_code_id'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Clothing Allowance record updated successfully');
    }

    public function destroy(ClothingAllowance $clothingAllowance)
    {
        $this->authorize('delete', $clothingAllowance);
        $clothingAllowance->delete();

        return redirect()->back()->with('success', 'Clothing Allowance record deleted successfully');
    }
}
