<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\ClaimType;
use App\Models\Employee;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EmployeeClaimController extends Controller
{
    /**
     * Show employee's own claims with submission form.
     */
    public function index(Request $request)
    {
        $employee = $this->getEmployee();
        if (! $employee) {
            return redirect()->route('employee.dashboard')->with('error', 'No linked employee record.');
        }

        $perPage = 10;
        $claimTypeId = $request->input('claim_type_id');

        $claims = Claim::where('employee_id', $employee->id)
            ->with('claimType')
            ->when($claimTypeId, fn($q) => $q->where('claim_type_id', $claimTypeId))
            ->orderBy('claim_date', 'desc')
            ->paginate($perPage);

        $allClaims = Claim::where('employee_id', $employee->id)->get();

        return Inertia::render('EmployeeDashboard/Claims', [
            'claims' => $claims,
            'claimTypes' => ClaimType::active()->orderBy('name')->get(),
            'filters' => [
                'claim_type_id' => $claimTypeId,
            ],
            'stats' => [
                'total' => $allClaims->count(),
                'totalAmount' => (float) $allClaims->sum('amount'),
                'recentCount' => $allClaims->where('created_at', '>=', now()->subMonth())->count(),
            ],
        ]);
    }

    /**
     * Store a new claim submitted by the employee.
     */
    public function store(Request $request): RedirectResponse
    {
        $employee = $this->getEmployee();
        if (! $employee) {
            return redirect()->back()->with('error', 'No linked employee record.');
        }

        $validated = $request->validate([
            'claim_type_id' => 'required|exists:claim_types,id',
            'amount' => 'required|numeric|min:0.01|max:9999999.99',
            'purpose' => 'required|string|max:500',
            'claim_date' => 'required|date|before_or_equal:today',
            'remarks' => 'nullable|string|max:1000',
        ]);

        $claim = Claim::create([
            'employee_id' => $employee->id,
            'claim_type_id' => $validated['claim_type_id'],
            'amount' => $validated['amount'],
            'purpose' => $validated['purpose'],
            'claim_date' => $validated['claim_date'],
            'remarks' => $validated['remarks'] ?? null,
            'created_by' => Auth::id(),
        ]);

        // Notify admins about new claim
        $employeeName = trim($employee->first_name . ' ' . $employee->last_name);
        $admins = User::role(['super admin', 'admin'])->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => Notification::TYPE_GENERAL,
                'title' => 'New Claim Submitted',
                'message' => "{$employeeName} submitted a new claim (₱" . number_format($claim->amount, 2) . ")",
                'link' => route('manage.employees.claims.index', $employee->id),
                'notifiable_id' => $claim->id,
                'notifiable_type' => get_class($claim),
            ]);
        }

        return redirect()->back()->with('success', 'Claim submitted successfully!');
    }

    /**
     * Delete own claim.
     */
    public function destroy(Claim $claim): RedirectResponse
    {
        $employee = $this->getEmployee();
        if (! $employee || $claim->employee_id !== $employee->id) {
            abort(403, 'Unauthorized.');
        }

        $claim->delete();

        return redirect()->back()->with('success', 'Claim deleted successfully.');
    }

    private function getEmployee(): ?Employee
    {
        return Employee::where('user_id', Auth::id())->first();
    }
}
