<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Contracts\Repositories\{
    OfficeRepositoryInterface,
    EmployeeRepositoryInterface,
    AdjustmentRepositoryInterface,
    AdjustmentTypeRepositoryInterface,
    ClaimRepositoryInterface,
    ClaimTypeRepositoryInterface,
    ClothingAllowanceRepositoryInterface,
    DeductionCategoryRepositoryInterface,
    DeductionTypeRepositoryInterface,
    EmploymentStatusRepositoryInterface,
    GeneralFundRepositoryInterface,
    HazardPayRepositoryInterface,
    PeraRepositoryInterface,
    RataRepositoryInterface,
    ReferenceTypeRepositoryInterface,
    SalaryRepositoryInterface,
    SourceOfFundCodeRepositoryInterface,
    SupplierRepositoryInterface,
    SupplierTransactionRepositoryInterface,
    EmployeeDeductionRepositoryInterface,
    DeleteRequestRepositoryInterface,
    DocumentTypeRepositoryInterface,
    AuditLogRepositoryInterface,
    NotificationRepositoryInterface
};
use App\Repositories\{
    OfficeRepository,
    EmployeeRepository,
    AdjustmentRepository,
    AdjustmentTypeRepository,
    ClaimRepository,
    ClaimTypeRepository,
    ClothingAllowanceRepository,
    DeductionCategoryRepository,
    DeductionTypeRepository,
    EmploymentStatusRepository,
    GeneralFundRepository,
    HazardPayRepository,
    PeraRepository,
    RataRepository,
    ReferenceTypeRepository,
    SalaryRepository,
    SourceOfFundCodeRepository,
    SupplierRepository,
    SupplierTransactionRepository,
    EmployeeDeductionRepository,
    DeleteRequestRepository,
    DocumentTypeRepository,
    AuditLogRepository,
    NotificationRepository
};

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(OfficeRepositoryInterface::class, OfficeRepository::class);
        $this->app->bind(EmployeeRepositoryInterface::class, EmployeeRepository::class);
        $this->app->bind(AdjustmentRepositoryInterface::class, AdjustmentRepository::class);
        $this->app->bind(AdjustmentTypeRepositoryInterface::class, AdjustmentTypeRepository::class);
        $this->app->bind(ClaimRepositoryInterface::class, ClaimRepository::class);
        $this->app->bind(ClaimTypeRepositoryInterface::class, ClaimTypeRepository::class);
        $this->app->bind(ClothingAllowanceRepositoryInterface::class, ClothingAllowanceRepository::class);
        $this->app->bind(DeductionCategoryRepositoryInterface::class, DeductionCategoryRepository::class);
        $this->app->bind(DeductionTypeRepositoryInterface::class, DeductionTypeRepository::class);
        $this->app->bind(EmploymentStatusRepositoryInterface::class, EmploymentStatusRepository::class);
        $this->app->bind(GeneralFundRepositoryInterface::class, GeneralFundRepository::class);
        $this->app->bind(HazardPayRepositoryInterface::class, HazardPayRepository::class);
        $this->app->bind(PeraRepositoryInterface::class, PeraRepository::class);
        $this->app->bind(RataRepositoryInterface::class, RataRepository::class);
        $this->app->bind(ReferenceTypeRepositoryInterface::class, ReferenceTypeRepository::class);
        $this->app->bind(SalaryRepositoryInterface::class, SalaryRepository::class);
        $this->app->bind(SourceOfFundCodeRepositoryInterface::class, SourceOfFundCodeRepository::class);
        $this->app->bind(SupplierRepositoryInterface::class, SupplierRepository::class);
        $this->app->bind(SupplierTransactionRepositoryInterface::class, SupplierTransactionRepository::class);
        $this->app->bind(EmployeeDeductionRepositoryInterface::class, EmployeeDeductionRepository::class);
        $this->app->bind(DeleteRequestRepositoryInterface::class, DeleteRequestRepository::class);
        $this->app->bind(DocumentTypeRepositoryInterface::class, DocumentTypeRepository::class);
        $this->app->bind(AuditLogRepositoryInterface::class, AuditLogRepository::class);
        $this->app->bind(NotificationRepositoryInterface::class, NotificationRepository::class);
    }
}
