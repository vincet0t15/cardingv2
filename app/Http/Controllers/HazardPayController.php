<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\HazardPay;
use App\Models\SourceOfFundCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HazardPayController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', HazardPay::class);
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
            ->with(['employmentStatus', 'office', 'latestHazardPay'])
            ->orderBy('last_name', 'asc')
            ->paginate(50)
            ->withQueryString();

        $sourceOfFundCodes = SourceOfFundCode::where('status', true)->orderBy('code')->get();

        return Inertia::render('hazard-pays/index', [
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
        $this->authorize('viewAny', HazardPay::class);
        $hazardPays = $employee->hazardPays()
            ->with('createdBy')
            ->orderBy('effective_date', 'desc')
            ->get();

        return Inertia::render('hazard-pays/history', [
            'employee' => $employee->load(['employmentStatus', 'office']),
            'hazardPays' => $hazardPays,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', HazardPay::class);
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'source_of_fund_code_id' => 'nullable|exists:source_of_fund_codes,id',
        ]);

        HazardPay::create([
            'employee_id' => $validated['employee_id'],
            'amount' => $validated['amount'],
            'effective_date' => $validated['effective_date'],
            'source_of_fund_code_id' => $validated['source_of_fund_code_id'] ?? null,
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Hazard Pay added successfully');
    }

    public function update(Request $request, HazardPay $hazardPay)
    {
        $this->authorize('update', $hazardPay);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'source_of_fund_code_id' => 'nullable|exists:source_of_fund_codes,id',
        ]);

        $hazardPay->update([
            'amount' => $validated['amount'],
            'effective_date' => $validated['effective_date'],
            'source_of_fund_code_id' => $validated['source_of_fund_code_id'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Hazard Pay record updated successfully');
    }

    public function destroy(HazardPay $hazardPay)
    {
        $this->authorize('delete', $hazardPay);
        $hazardPay->delete();

        return redirect()->back()->with('success', 'Hazard Pay record deleted successfully');
    }
}
