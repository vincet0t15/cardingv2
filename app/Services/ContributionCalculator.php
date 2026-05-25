<?php

namespace App\Services;

use App\Models\SSSContributionTable;
use Illuminate\Support\Collection;

class ContributionCalculator
{
    // Current contribution rates
    public const PAGIBIG_EMPLOYEE_RATE = 0.02;
    public const PAGIBIG_EMPLOYER_RATE = 0.02;
    public const PAGIBIG_MAX_MONTHLY = 5000;
    public const PAGIBIG_MIN_MONTHLY = 100;

    public const PHILHEALTH_EMPLOYEE_RATE = 0.05;
    public const PHILHEALTH_EMPLOYER_RATE = 0.05;
    public const PHILHEALTH_MAX_MONTHLY = 80000; // Cap at ₱80,000 basic salary

    /**
     * Calculate SSS contribution (Employee Share)
     * Uses bracket-based table lookup
     */
    public function calculateSSSEmployee(float $monthlySalary, ?int $year = null): float
    {
        if ($monthlySalary <= 0) {
            return 0;
        }

        return SSSContributionTable::calculateEmployeeShare($monthlySalary, $year);
    }

    /**
     * Calculate SSS contribution (Employer Share)
     * Uses bracket-based table lookup
     */
    public function calculateSSSEMployer(float $monthlySalary, ?int $year = null): float
    {
        if ($monthlySalary <= 0) {
            return 0;
        }

        return SSSContributionTable::calculateEmployerShare($monthlySalary, $year);
    }

    /**
     * Calculate PhilHealth contribution
     * 5% of monthly basic salary (split 50-50 employee/employer)
     * Capped at ₱80,000 monthly basic
     */
    public function calculatePhilHealthEmployee(float $monthlyBasicSalary): float
    {
        if ($monthlyBasicSalary <= 0) {
            return 0;
        }

        $salaryBase = min($monthlyBasicSalary, self::PHILHEALTH_MAX_MONTHLY);
        $totalContribution = $salaryBase * self::PHILHEALTH_EMPLOYEE_RATE;
        
        return round($totalContribution / 2, 2); // Employee pays 50%
    }

    /**
     * Calculate PhilHealth contribution (Employer Share)
     */
    public function calculatePhilHealthEmployer(float $monthlyBasicSalary): float
    {
        if ($monthlyBasicSalary <= 0) {
            return 0;
        }

        $salaryBase = min($monthlyBasicSalary, self::PHILHEALTH_MAX_MONTHLY);
        $totalContribution = $salaryBase * self::PHILHEALTH_EMPLOYER_RATE;
        
        return round($totalContribution / 2, 2); // Employer pays 50%
    }

    /**
     * Calculate Pag-IBIG contribution (Employee Share)
     * 2% of monthly basic salary
     * Min ₱100, Max ₱5,000
     */
    public function calculatePagibigEmployee(float $monthlyBasicSalary): float
    {
        if ($monthlyBasicSalary <= 0) {
            return 0;
        }

        $contribution = $monthlyBasicSalary * self::PAGIBIG_EMPLOYEE_RATE;
        
        return round(max(self::PAGIBIG_MIN_MONTHLY, min($contribution, self::PAGIBIG_MAX_MONTHLY)), 2);
    }

    /**
     * Calculate Pag-IBIG contribution (Employer Share)
     */
    public function calculatePagibigEmployer(float $monthlyBasicSalary): float
    {
        if ($monthlyBasicSalary <= 0) {
            return 0;
        }

        $contribution = $monthlyBasicSalary * self::PAGIBIG_EMPLOYER_RATE;
        
        return round(max(self::PAGIBIG_MIN_MONTHLY, min($contribution, self::PAGIBIG_MAX_MONTHLY)), 2);
    }

    /**
     * Calculate all mandatory contributions for an employee
     * Returns array with all contributions
     */
    public function calculateAllContributions(
        float $monthlySalary,
        float $monthlyBasicSalary,
        bool $isGovernmentEmployee = true,
        ?int $year = null
    ): array {
        $contributions = [
            'monthly_salary' => $monthlySalary,
            'monthly_basic_salary' => $monthlyBasicSalary,
            'year' => $year ?? now()->year,
        ];

        if ($isGovernmentEmployee) {
            // Government employees - GSIS instead of SSS
            // For now, we'll include GSIS as placeholder
            // GSIS computation is different from SSS
            $contributions['sss'] = [
                'employee' => 0, // N/A for government
                'employer' => 0, // N/A for government
                'description' => 'Government employees are under GSIS, not SSS',
            ];
            
            // GSIS contribution rate (roughly 9% for employee)
            $contributions['gsis'] = [
                'employee' => round($monthlySalary * 0.09, 2),
                'employer' => round($monthlySalary * 0.14, 2), // Government pays more
                'description' => 'GSIS - Government Service Insurance System',
            ];
        } else {
            // Private employees - SSS
            $contributions['gsis'] = [
                'employee' => 0,
                'employer' => 0,
                'description' => 'N/A - Private employee',
            ];
            
            $contributions['sss'] = [
                'employee' => $this->calculateSSSEmployee($monthlySalary, $year),
                'employer' => $this->calculateSSSEMployer($monthlySalary, $year),
                'description' => 'SSS - Social Security System',
            ];
        }

        $contributions['philhealth'] = [
            'employee' => $this->calculatePhilHealthEmployee($monthlyBasicSalary),
            'employer' => $this->calculatePhilHealthEmployer($monthlyBasicSalary),
            'description' => 'PhilHealth - Philippine Health Insurance Corporation',
        ];

        $contributions['pagibig'] = [
            'employee' => $this->calculatePagibigEmployee($monthlyBasicSalary),
            'employer' => $this->calculatePagibigEmployer($monthlyBasicSalary),
            'description' => 'Pag-IBIG - Home Development Mutual Fund',
        ];

        // Calculate totals
        $contributions['total_employee_share'] = 
            $contributions['sss']['employee'] +
            $contributions['gsis']['employee'] +
            $contributions['philhealth']['employee'] +
            $contributions['pagibig']['employee'];

        $contributions['total_employer_share'] = 
            $contributions['sss']['employer'] +
            $contributions['gsis']['employer'] +
            $contributions['philhealth']['employer'] +
            $contributions['pagibig']['employer'];

        return $contributions;
    }

    /**
     * Get employee mandatory deductions only (deducted from salary)
     */
    public function getEmployeeMandatoryDeductions(
        float $monthlySalary,
        float $monthlyBasicSalary,
        bool $isGovernmentEmployee = true,
        ?int $year = null
    ): array {
        $allContributions = $this->calculateAllContributions(
            $monthlySalary,
            $monthlyBasicSalary,
            $isGovernmentEmployee,
            $year
        );

        return [
            'sss_employee' => $allContributions['sss']['employee'],
            'gsis_employee' => $allContributions['gsis']['employee'],
            'philhealth_employee' => $allContributions['philhealth']['employee'],
            'pagibig_employee' => $allContributions['pagibig']['employee'],
            'total_deductions' => $allContributions['total_employee_share'],
        ];
    }
}