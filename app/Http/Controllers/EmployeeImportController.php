<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\Office;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class EmployeeImportController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('employees/import', [
            'sampleHeaders' => ['first_name', 'middle_name', 'last_name', 'suffix', 'position', 'is_rata_eligible', 'employment_status', 'office'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:10240',
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();

        if ($extension === 'csv') {
            $result = $this->processCsv($file);
        } else {
            return redirect()->back()->with('error', 'Only CSV files are supported. For Excel files, please save as CSV first.');
        }

        if ($result['errors']) {
            return redirect()->back()->with('error', "Import completed with {$result['errors']} errors. {$result['imported']} employees imported successfully.");
        }

        return redirect()->route('employees.index')->with('success', "Successfully imported {$result['imported']} employees.");
    }

    public function downloadSample(): BinaryFileResponse
    {
        $path = storage_path('app/public/sample-employees.csv');

        if (! file_exists($path)) {
            $content = "first_name,middle_name,last_name,suffix,position,is_rata_eligible,employment_status,office\n";
            $content .= "Juan,Dela,Cruz,Jr.,Developer,true,Full-time,Main Office\n";
            $content .= "Maria,Santos,Reyes,,Designer,false,Part-time,Branch Office\n";

            Storage::disk('public')->put('sample-employees.csv', $content);
        }

        return response()->download($path, 'sample-employees.csv');
    }

    protected function processCsv($file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        $headers = fgetcsv($handle);

        $requiredColumns = ['first_name', 'last_name', 'employment_status', 'office'];
        $missingColumns = array_diff($requiredColumns, $headers);

        if ($missingColumns) {
            fclose($handle);
            throw new \InvalidArgumentException('Missing required columns: ' . implode(', ', $missingColumns));
        }

        $employmentStatuses = EmploymentStatus::all()->keyBy('name');
        $offices = Office::all()->keyBy('name');

        $imported = 0;
        $errors = 0;
        $row = 1;

        while (($data = fgetcsv($handle)) !== false) {
            $row++;
            $record = array_combine($headers, $data);

            $validator = Validator::make($record, [
                'first_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'suffix' => 'nullable|string|max:255',
                'position' => 'nullable|string|max:255',
                'is_rata_eligible' => 'boolean',
                'employment_status' => 'required|string',
                'office' => 'required|string',
            ]);

            if ($validator->fails()) {
                $errors++;

                continue;
            }

            $employmentStatus = $employmentStatuses->get($record['employment_status']);
            $office = $offices->get($record['office']);

            if (! $employmentStatus || ! $office) {
                $errors++;

                continue;
            }

            Employee::create([
                'first_name' => $record['first_name'],
                'middle_name' => $record['middle_name'] ?? null,
                'last_name' => $record['last_name'],
                'suffix' => $record['suffix'] ?? null,
                'position' => $record['position'] ?? null,
                'is_rata_eligible' => filter_var($record['is_rata_eligible'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'employment_status_id' => $employmentStatus->id,
                'office_id' => $office->id,
                'created_by' => Auth::id(),
            ]);

            $imported++;
        }

        fclose($handle);

        return ['imported' => $imported, 'errors' => $errors];
    }
}
