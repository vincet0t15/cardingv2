<?php

namespace App\Models;

use App\Services\ContributionCalculator;
use App\Services\TaxCalculator;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeductionType extends Model
{
    use Auditable;

    protected $fillable = [
        'name',
        'code',
        'contribution_code',
        'category_id',
        'description',
        'calculation_method',
        'rate',
        'cap_amount',
        'min_amount',
        'is_auto_calculated',
        'is_mandatory',
        'employment_type',
        'remittance_frequency',
        'is_active',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
        'cap_amount' => 'decimal:2',
        'min_amount' => 'decimal:2',
        'is_auto_calculated' => 'boolean',
        'is_mandatory' => 'boolean',
        'is_active' => 'boolean',
    ];

    // Contribution codes
    const CONTRIB_SSS = 'SSS';
    const CONTRIB_GSIS = 'GSIS';
    const CONTRIB_PHILHEALTH = 'PHILHEALTH';
    const CONTRIB_PAGIBIG = 'PAGIBIG';
    const CONTRIB_TAX = 'TAX';
    const CONTRIB_OTHER = 'OTHER';

    // Calculation methods
    const METHOD_FIXED = 'fixed';
    const METHOD_PERCENTAGE = 'percentage';
    const METHOD_BRACKET = 'bracket';

    // Employment types
    const EMP_ALL = 'all';
    const EMP_PLANTILLA = 'plantilla';
    const EMP_COS = 'cos';
    const EMP_JO = 'jo';

    public function employeeDeductions(): HasMany
    {
        return $this->hasMany(EmployeeDeduction::class);
    }

    public function category()
    {
        return $this->belongsTo(DeductionCategory::class, 'category_id');
    }

    /**
     * Scope to get only active deduction types
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only auto-calculated deduction types
     */
    public function scopeAutoCalculated($query)
    {
        return $query->where('is_auto_calculated', true);
    }

    /**
     * Scope to get mandatory deduction types
     */
    public function scopeMandatory($query)
    {
        return $query->where('is_mandatory', true);
    }

    /**
     * Check if this deduction applies to a specific employment type
     */
    public function appliesToEmploymentType(string $employmentType): bool
    {
        return $this->employment_type === self::EMP_ALL 
            || $this->employment_type === $employmentType;
    }

    /**
     * Calculate deduction amount based on salary
     */
    public function calculate(float $monthlySalary, ?float $monthlyBasicSalary = null, ?int $year = null): float
    {
        $monthlyBasicSalary = $monthlyBasicSalary ?? $monthlySalary;
        $amount = 0;

        if (!$this->is_auto_calculated) {
            return $amount;
        }

        switch ($this->contribution_code) {
            case self::CONTRIB_SSS:
                $calculator = new ContributionCalculator();
                $amount = $calculator->calculateSSSEmployee($monthlySalary, $year);
                break;

            case self::CONTRIB_GSIS:
                // GSIS contribution for government employees
                $amount = round($monthlySalary * 0.09, 2);
                break;

            case self::CONTRIB_PHILHEALTH:
                $calculator = new ContributionCalculator();
                $amount = $calculator->calculatePhilHealthEmployee($monthlyBasicSalary);
                break;

            case self::CONTRIB_PAGIBIG:
                $calculator = new ContributionCalculator();
                $amount = $calculator->calculatePagibigEmployee($monthlyBasicSalary);
                break;

            case self::CONTRIB_TAX:
                $taxCalculator = new TaxCalculator();
                $amount = $taxCalculator->calculateMonthlyTax($monthlySalary, $year);
                break;

            case self::CONTRIB_OTHER:
            default:
                // Use custom rate calculation
                $amount = $this->calculateCustomDeduction($monthlySalary, $monthlyBasicSalary);
                break;
        }

        // Apply cap if set
        if ($this->cap_amount !== null && $amount > $this->cap_amount) {
            $amount = (float) $this->cap_amount;
        }

        // Apply minimum if set
        if ($this->min_amount !== null && $amount < $this->min_amount) {
            $amount = (float) $this->min_amount;
        }

        return round($amount, 2);
    }

    /**
     * Calculate deduction using custom percentage or fixed rate
     */
    protected function calculateCustomDeduction(float $monthlySalary, float $monthlyBasicSalary): float
    {
        $amount = 0;

        switch ($this->calculation_method) {
            case self::METHOD_FIXED:
                $amount = (float) $this->rate;
                break;

            case self::METHOD_PERCENTAGE:
                $baseSalary = $monthlyBasicSalary ?? $monthlySalary;
                $amount = $baseSalary * ((float) $this->rate / 100);
                break;

            case self::METHOD_BRACKET:
                // For bracket-based, use the contribution table if applicable
                // Otherwise fall back to percentage
                $baseSalary = $monthlyBasicSalary ?? $monthlySalary;
                $amount = $baseSalary * ((float) $this->rate / 100);
                break;
        }

        return $amount;
    }

    /**
     * Get the label for remittance frequency
     */
    public static function getFrequencyLabel(?string $frequency): string
    {
        return match ($frequency) {
            'monthly' => 'Monthly',
            'quarterly' => 'Quarterly',
            'semi_annual' => 'Semi-Annual',
            'annual' => 'Annual',
            default => 'N/A',
        };
    }
}