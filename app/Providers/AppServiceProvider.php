<?php

namespace App\Providers;

use App\Models\Claim;
use App\Models\Employee;
use App\Models\Pera;
use App\Models\Rata;
use App\Models\Salary;
use App\Models\Supplier;
use App\Policies\ClaimPolicy;
use App\Policies\EmployeePolicy;
use App\Policies\PeraPolicy;
use App\Policies\RataPolicy;
use App\Policies\SalaryPolicy;
use App\Policies\SupplierPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Employee::class, EmployeePolicy::class);
        Gate::policy(Salary::class, SalaryPolicy::class);
        Gate::policy(Claim::class, ClaimPolicy::class);
        Gate::policy(Supplier::class, SupplierPolicy::class);
        Gate::policy(Pera::class, PeraPolicy::class);
        Gate::policy(Rata::class, RataPolicy::class);
    }
}
