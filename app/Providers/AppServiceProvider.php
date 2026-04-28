<?php

namespace App\Providers;

use App\Models\AdjustmentType;
use App\Models\Claim;
use App\Models\ClaimType;
use App\Models\ClothingAllowance;
use App\Models\DeductionType;
use App\Models\DocumentType;
use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\HazardPay;
use App\Models\Office;
use App\Models\Pera;
use App\Models\Rata;
use App\Models\ReferenceType;
use App\Models\Salary;
use App\Models\Supplier;
use App\Models\EmployeeDeduction;
use App\Policies\AdjustmentTypePolicy;
use App\Policies\EmployeeDeductionPolicy;
use App\Policies\ClaimPolicy;
use App\Policies\ClaimTypePolicy;
use App\Policies\ClothingAllowancePolicy;
use App\Policies\DeductionTypePolicy;
use App\Policies\DeductionCategoryPolicy;
use App\Policies\DeleteRequestPolicy;
use App\Policies\DocumentTypePolicy;
use App\Policies\EmployeePolicy;
use App\Policies\EmploymentStatusPolicy;
use App\Policies\HazardPayPolicy;
use App\Policies\OfficePolicy;
use App\Policies\PeraPolicy;
use App\Policies\RataPolicy;
use App\Policies\ReferenceTypePolicy;
use App\Policies\SalaryPolicy;
use App\Policies\SupplierPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

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
        Gate::policy(Office::class, OfficePolicy::class);
        Gate::policy(EmploymentStatus::class, EmploymentStatusPolicy::class);
        Gate::policy(DeductionType::class, DeductionTypePolicy::class);
        Gate::policy(\App\Models\DeductionCategory::class, DeductionCategoryPolicy::class);
        Gate::policy(DocumentType::class, DocumentTypePolicy::class);
        Gate::policy(ClaimType::class, ClaimTypePolicy::class);
        Gate::policy(HazardPay::class, HazardPayPolicy::class);
        Gate::policy(ClothingAllowance::class, ClothingAllowancePolicy::class);
        Gate::policy(AdjustmentType::class, AdjustmentTypePolicy::class);
        Gate::policy(ReferenceType::class, ReferenceTypePolicy::class);
        Gate::policy(EmployeeDeduction::class, EmployeeDeductionPolicy::class);
        Gate::policy(\App\Models\DeleteRequest::class, DeleteRequestPolicy::class);

        if (config('app.env') !== 'local') {
            URL::forceScheme('https');
        }
    }
}
