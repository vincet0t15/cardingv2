<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EmployeeProfileController extends Controller
{
    /**
     * Show profile editing page.
     */
    public function edit()
    {
        $employee = Employee::where('user_id', Auth::id())->first();

        if (! $employee) {
            return redirect()->route('employee.dashboard')->with('error', 'No linked employee record.');
        }

        $employee->load(['office', 'employmentStatus']);

        return Inertia::render('EmployeeDashboard/Profile', [
            'employee' => $employee,
        ]);
    }

    /**
     * Update employee profile.
     */
    public function update(Request $request): RedirectResponse
    {
        $employee = Employee::where('user_id', Auth::id())->first();

        if (! $employee) {
            return redirect()->back()->with('error', 'No linked employee record.');
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'suffix' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'birthdate' => 'nullable|date',
            'photo' => ['nullable', 'image', 'max:2048', 'mimes:jpg,jpeg,png,webp'],
        ]);

        $employee->fill($validated);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            $oldImage = $employee->getRawOriginal('image_path');
            $path = $request->file('photo')->store('employees', 'public');
            $employee->image_path = $path;
            if ($oldImage) {
                Storage::disk('public')->delete($oldImage);
            }
        }

        $employee->save();

        return redirect()->back()->with('success', 'Profile updated successfully!');
    }
}
