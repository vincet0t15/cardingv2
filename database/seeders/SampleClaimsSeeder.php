<?php

namespace Database\Seeders;

use App\Models\Claim;
use App\Models\ClaimType;
use App\Models\Employee;
use Illuminate\Database\Seeder;

class SampleClaimsSeeder extends Seeder
{
    public function run(): void
    {
        // Get claim types
        $travelType = ClaimType::where('code', 'TRAVEL')->first();
        $overtimeType = ClaimType::where('code', 'OVERTIME')->first();

        if (!$travelType || !$overtimeType) {
            $this->command->error('Travel or Overtime claim type not found. Run ClaimTypeSeeder first.');
            return;
        }

        // Get employees
        $employees = Employee::with('office')->get();

        // If no employees exist, create sample ones
        if ($employees->isEmpty()) {
            $this->command->info('No employees found. Creating sample employees...');

            $offices = \App\Models\Office::all();
            $employmentStatuses = \App\Models\EmploymentStatus::all();

            if ($offices->isEmpty() || $employmentStatuses->isEmpty()) {
                $this->command->error('Offices or Employment Statuses not found. Run main seeders first.');
                return;
            }

            // Create a system user for audit trail if none exists
            $systemUser = \App\Models\User::first();
            if (!$systemUser) {
                $this->command->info('Creating system user...');
                $systemUser = \App\Models\User::create([
                    'name' => 'System Administrator',
                    'username' => 'system',
                    'password' => bcrypt('password'),
                    'is_active' => true,
                ]);
            }

            $this->command->info("Using user ID: {$systemUser->id} for created_by");

            $sampleNames = [
                ['Juan', 'Dela', 'Cruz', null],
                ['Maria', 'Santos', 'Reyes', null],
                ['Pedro', 'Garcia', 'Lopez', null],
                ['Ana', 'Rodriguez', 'Martinez', null],
                ['Carlos', 'Fernandez', 'Gonzalez', null],
                ['Rosa', 'Perez', 'Torres', null],
                ['Luis', 'Rivera', 'Morales', null],
                ['Elena', 'Castillo', 'Ramirez', null],
                ['Miguel', 'Flores', 'Vasquez', null],
                ['Sofia', 'Hernandez', 'Diaz', null],
                ['Antonio', 'Jimenez', 'Ruiz', null],
                ['Isabella', 'Moreno', 'Alvarez', null],
            ];

            foreach ($sampleNames as $index => $nameData) {
                \Illuminate\Support\Facades\DB::table('employees')->insert([
                    'first_name' => $nameData[0],
                    'middle_name' => $nameData[1],
                    'last_name' => $nameData[2],
                    'suffix' => $nameData[3],
                    'position' => 'Employee ' . ($index + 1),
                    'office_id' => $offices[$index % $offices->count()]->id,
                    'employment_status_id' => $employmentStatuses->first()->id,
                    'created_by' => $systemUser->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $employees = Employee::with('office')->get();
            $this->command->info('Sample employees created successfully!');
        }

        $this->command->info('Creating sample travel and overtime claims...');

        // Create travel claims for top 10 employees (varying amounts and frequencies)
        $travelData = [
            ['employee_index' => 0, 'trips' => 15, 'amount_range' => [2000, 5000]],
            ['employee_index' => 1, 'trips' => 12, 'amount_range' => [2500, 4500]],
            ['employee_index' => 2, 'trips' => 10, 'amount_range' => [2000, 4000]],
            ['employee_index' => 3, 'trips' => 9, 'amount_range' => [2000, 3500]],
            ['employee_index' => 4, 'trips' => 8, 'amount_range' => [1500, 3000]],
            ['employee_index' => 5, 'trips' => 7, 'amount_range' => [2000, 3500]],
            ['employee_index' => 6, 'trips' => 6, 'amount_range' => [1500, 3000]],
            ['employee_index' => 7, 'trips' => 5, 'amount_range' => [2000, 4000]],
            ['employee_index' => 8, 'trips' => 4, 'amount_range' => [1500, 2500]],
            ['employee_index' => 9, 'trips' => 3, 'amount_range' => [2000, 3000]],
        ];

        foreach ($travelData as $data) {
            $employeeIndex = min($data['employee_index'], $employees->count() - 1);
            $employee = $employees[$employeeIndex];

            for ($i = 0; $i < $data['trips']; $i++) {
                $amount = rand($data['amount_range'][0], $data['amount_range'][1]);
                $day = rand(1, 28);

                Claim::create([
                    'employee_id' => $employee->id,
                    'claim_type_id' => $travelType->id,
                    'amount' => $amount,
                    'claim_date' => now()->year . '-' . str_pad(now()->month, 2, '0', STR_PAD_LEFT) . '-' . str_pad($day, 2, '0', STR_PAD_LEFT),
                    'purpose' => 'Official travel to ' . ['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig'][array_rand(['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig'])],
                    'remarks' => 'Sample data for dashboard testing',
                ]);
            }
        }

        $this->command->info('Travel claims created successfully!');

        // Create overtime claims for top 10 employees
        $overtimeData = [
            ['employee_index' => 0, 'claims' => 8, 'amount_range' => [3000, 6000]],
            ['employee_index' => 1, 'claims' => 7, 'amount_range' => [2500, 5000]],
            ['employee_index' => 2, 'claims' => 6, 'amount_range' => [2000, 4500]],
            ['employee_index' => 3, 'claims' => 6, 'amount_range' => [2500, 4000]],
            ['employee_index' => 4, 'claims' => 5, 'amount_range' => [2000, 3500]],
            ['employee_index' => 5, 'claims' => 5, 'amount_range' => [2000, 4000]],
            ['employee_index' => 6, 'claims' => 4, 'amount_range' => [1500, 3000]],
            ['employee_index' => 7, 'claims' => 4, 'amount_range' => [2000, 3500]],
            ['employee_index' => 8, 'claims' => 3, 'amount_range' => [1500, 2500]],
            ['employee_index' => 9, 'claims' => 3, 'amount_range' => [2000, 3000]],
        ];

        foreach ($overtimeData as $data) {
            $employeeIndex = min($data['employee_index'], $employees->count() - 1);
            $employee = $employees[$employeeIndex];

            for ($i = 0; $i < $data['claims']; $i++) {
                $amount = rand($data['amount_range'][0], $data['amount_range'][1]);
                $day = rand(1, 28);

                Claim::create([
                    'employee_id' => $employee->id,
                    'claim_type_id' => $overtimeType->id,
                    'amount' => $amount,
                    'claim_date' => now()->year . '-' . str_pad(now()->month, 2, '0', STR_PAD_LEFT) . '-' . str_pad($day, 2, '0', STR_PAD_LEFT),
                    'purpose' => 'Overtime work for ' . ['project completion', 'urgent deliverables', 'system maintenance', 'report preparation', 'emergency response'][array_rand(['project completion', 'urgent deliverables', 'system maintenance', 'report preparation', 'emergency response'])],
                    'remarks' => 'Sample data for dashboard testing',
                ]);
            }
        }

        $this->command->info('Overtime claims created successfully!');
        $this->command->info('Sample data creation complete! Refresh your dashboard to see the charts.');
    }
}
