<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking salaries for April 2026 (month=4, year=2026)\n\n";

// Check total salaries in April 2026
$aprilSalaries = \App\Models\Salary::whereMonth('effective_date', 4)
    ->whereYear('effective_date', 2026)
    ->count();

echo "Total salary records in April 2026: {$aprilSalaries}\n\n";

// Check employees with salaries in April 2026
$employees = \App\Models\Employee::whereHas('salaries', function ($q) {
    $q->whereMonth('effective_date', 4)
        ->whereYear('effective_date', 2026);
})->with(['latestSalary', 'office'])->get();

echo "Employees with salaries in April 2026: " . $employees->count() . "\n\n";

if ($employees->count() > 0) {
    foreach ($employees->take(5) as $emp) {
        echo "ID: {$emp->id}\n";
        echo "Name: {$emp->first_name} {$emp->last_name}\n";
        echo "Office: " . ($emp->office ? $emp->office->name : 'N/A') . "\n";
        echo "Latest Salary: " . ($emp->latestSalary ? $emp->latestSalary->amount : 'N/A') . "\n";
        echo "Latest Salary Date: " . ($emp->latestSalary ? $emp->latestSalary->effective_date : 'N/A') . "\n\n";
    }
} else {
    echo "No employees found with salaries in April 2026.\n";
    echo "\nLet's check what months have salaries:\n\n";

    $salaryMonths = \App\Models\Salary::selectRaw('YEAR(effective_date) as year, MONTH(effective_date) as month, COUNT(*) as count')
        ->groupBy('year', 'month')
        ->orderBy('year', 'desc')
        ->orderBy('month', 'desc')
        ->get();

    foreach ($salaryMonths as $sm) {
        $monthName = date('F', mktime(0, 0, 0, $sm->month, 1));
        echo "{$monthName} {$sm->year}: {$sm->count} records\n";
    }
}
