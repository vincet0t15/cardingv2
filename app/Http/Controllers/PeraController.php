<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\Office;
use App\Models\Pera;
use App\Traits\HandlesDeletionRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PeraController extends Controller
{
    use HandlesDeletionRequests;
    public function index(Request $request)
    {
        $this->authorize('viewAny', Pera::class);
        $search = $request->input('search');
        $officeId = $request->input('office_id');
        $employmentStatusId = $request->input('employment_status_id');
        $month = $request->input('month');
        $year = $request->input('year');

        $employees = Employee::query()
            ->when($month && $year, function ($query) use ($month, $year) {
                // If month/year filter is applied, only show employees with peras in that period
                $query->whereHas('peras', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            }, function ($query) {
                // If no month/year filter, show all employees who have ANY pera record
                $query->has('peras');
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
            ->with(['employmentStatus', 'office', 'latestPera'])
            ->orderBy('last_name', 'asc')
            ->paginate(50)
            ->withQueryString();

        $offices = Office::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();

        return Inertia::render('peras/index', [
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
        $this->authorize('viewAny', Pera::class);
        $month = $request->input('month');
        $year = $request->input('year');

        $employees = Employee::query()
            ->has('peras')
            ->when($month && $year, function ($query) use ($month, $year) {
                $query->whereHas('peras', function ($q) use ($month, $year) {
                    $q->whereMonth('effective_date', $month)
                        ->whereYear('effective_date', $year);
                });
            })
            ->with(['office', 'latestPera'])
            ->orderBy('last_name', 'asc')
            ->get();

        $totalPera = $employees->sum(function ($employee) {
            return $employee->latest_pera ? (float) $employee->latest_pera->amount : 0;
        });

        return Inertia::render('peras/print', [
            'employees' => $employees,
            'month' => $month,
            'year' => $year,
            'totalPera' => $totalPera,
        ]);
    }

    public function history(Request $request, Employee $employee)
    {
        $this->authorize('viewAny', Pera::class);
        $peras = $employee->peras()
            ->with('createdBy')
            ->orderBy('effective_date', 'desc')
            ->get();

        return Inertia::render('peras/history', [
            'employee' => $employee->load(['employmentStatus', 'office']),
            'peras' => $peras,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Pera::class);
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
        ]);

        Pera::create([
            'employee_id' => $validated['employee_id'],
            'amount' => $validated['amount'],
            'effective_date' => $validated['effective_date'],
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'PERA added successfully');
    }

    public function update(Request $request, Pera $pera)
    {
        $this->authorize('update', $pera);
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
        ]);

        $pera->update([
            'amount' => $validated['amount'],
            'effective_date' => $validated['effective_date'],
        ]);

        return redirect()->back()->with('success', 'PERA record updated successfully');
    }

    public function destroy(Pera $pera)
    {
        return $this->handleDeletion($pera, 'peras.delete');
    }
}
