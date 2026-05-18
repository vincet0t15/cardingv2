<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\Office;
use App\Models\Rata;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RataController extends Controller
{
    use HandlesDeletionRequests;
    public function index(Request $request)
    {
        $this->authorize('viewAny', Rata::class);
        $search = $request->input('search');
        $officeId = $request->input('office_id');
        $employmentStatusId = $request->input('employment_status_id');
        $month = $request->input('month');
        $year = $request->input('year');

        $employees = Employee::query()
            ->where('is_rata_eligible', true)
            ->when($month && $year, function ($query) use ($month, $year) {
                // If month/year filter is applied, only show employees with ratas in that period
                $query->whereHas('ratas', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            }, function ($query) {
                // If no month/year filter, show all employees who have ANY rata record
                $query->has('ratas');
            })
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
            ->with(['employmentStatus', 'office', 'latestRata'])
            ->orderBy('last_name', 'asc')
            ->paginate(50)
            ->withQueryString();

        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();

        return Inertia::render('ratas/index', [
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
        $this->authorize('viewAny', Rata::class);
        $month = $request->input('month');
        $year = $request->input('year');

        $employees = Employee::query()
            ->has('ratas')
            ->when($month && $year, function ($query) use ($month, $year) {
                $query->whereHas('ratas', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            })
            ->with(['office', 'latestRata'])
            ->orderBy('last_name', 'asc')
            ->get();

        $totalRata = $employees->sum(function ($employee) {
            return $employee->latest_rata ? (float) $employee->latest_rata->amount : 0;
        });

        return Inertia::render('ratas/print', [
            'employees' => $employees,
            'month' => $month,
            'year' => $year,
            'totalRata' => $totalRata,
        ]);
    }

    public function history(Request $request, Employee $employee)
    {
        $this->authorize('viewAny', Rata::class);
        $ratas = $employee->ratas()
            ->with('createdBy')
            ->orderBy('effective_date', 'desc')
            ->get();

        return Inertia::render('ratas/history', [
            'employee' => $employee->load(['employmentStatus', 'office']),
            'ratas' => $ratas,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Rata::class);
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
        ]);

        Rata::create([
            'employee_id' => $validated['employee_id'],
            'amount' => $validated['amount'],
            'effective_date' => $validated['effective_date'],
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'RATA added successfully');
    }

    public function update(Request $request, Rata $rata)
    {
        $this->authorize('update', $rata);
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
        ]);

        $rata->update([
            'amount' => $validated['amount'],
            'effective_date' => $validated['effective_date'],
        ]);

        return redirect()->back()->with('success', 'RATA record updated successfully');
    }

    public function destroy(Rata $rata)
    {
        return $this->handleDeletion($rata, 'ratas.delete');
    }
}
