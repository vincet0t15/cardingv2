<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\HazardPay;
use App\Models\Office;
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
        $month = $request->input('month');
        $year = $request->input('year');

        $employees = Employee::query()
            ->has('hazardPays') // Only show employees who have hazard pay records
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
            ->when($month && $year, function ($query) use ($month, $year) {
                // Filter employees who have hazard pays effective in the specified month/year
                $query->whereHas('hazardPays', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            })
            ->with(['employmentStatus', 'office', 'latestHazardPay'])
            ->orderBy('last_name', 'asc')
            ->paginate(50)
            ->withQueryString();

        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();

        return Inertia::render('hazard-pays/index', [
            'employees' => $employees,
            'offices' => $offices,
            'employmentStatuses' => $employmentStatuses,
            'filters' => [
                'search' => $search,
                'office_id' => $officeId,
                'employment_status_id' => $employmentStatusId,
                'month' => $month,
                'year' => $year,
            ],
        ]);
    }

    public function print(Request $request)
    {
        $this->authorize('viewAny', HazardPay::class);
        $month = $request->input('month');
        $year = $request->input('year');

        $employees = Employee::query()
            ->has('hazardPays')
            ->when($month && $year, function ($query) use ($month, $year) {
                $query->whereHas('hazardPays', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            })
            ->with(['office', 'latestHazardPay'])
            ->orderBy('last_name', 'asc')
            ->get();

        $totalHazardPay = $employees->sum(function ($employee) {
            return $employee->latest_hazard_pay ? (float) $employee->latest_hazard_pay->amount : 0;
        });

        return Inertia::render('hazard-pays/print', [
            'employees' => $employees,
            'month' => $month,
            'year' => $year,
            'totalHazardPay' => $totalHazardPay,
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
