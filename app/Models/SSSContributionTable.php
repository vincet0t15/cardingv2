<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SSSContributionTable extends Model
{
    use HasFactory;

    protected $table = 'sss_contribution_tables';

    protected $fillable = [
        'salary_from',
        'salary_to',
        'monthly_salary_credit',
        'employee_share',
        'employer_share',
        'total_contribution',
        'year',
        'is_active',
    ];

    protected $casts = [
        'salary_from' => 'decimal:2',
        'salary_to' => 'decimal:2',
        'monthly_salary_credit' => 'decimal:2',
        'employee_share' => 'decimal:2',
        'employer_share' => 'decimal:2',
        'total_contribution' => 'decimal:2',
        'year' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the contribution bracket for a given monthly salary
     */
    public static function getBracketForSalary(float $monthlySalary, ?int $year = null): ?self
    {
        $year = $year ?? now()->year;

        return static::where('is_active', true)
            ->where('year', $year)
            ->where('salary_from', '<=', $monthlySalary)
            ->where('salary_to', '>=', $monthlySalary)
            ->first();
    }

    /**
     * Calculate employee SSS contribution for a given salary
     */
    public static function calculateEmployeeShare(float $monthlySalary, ?int $year = null): float
    {
        $bracket = static::getBracketForSalary($monthlySalary, $year);
        
        return $bracket ? (float) $bracket->employee_share : 0;
    }

    /**
     * Calculate employer SSS contribution for a given salary
     */
    public static function calculateEmployerShare(float $monthlySalary, ?int $year = null): float
    {
        $bracket = static::getBracketForSalary($monthlySalary, $year);
        
        return $bracket ? (float) $bracket->employer_share : 0;
    }

    /**
     * Get all brackets for a given year
     */
    public static function getBracketsForYear(int $year): \Illuminate\Database\Eloquent\Collection
    {
        return static::where('is_active', true)
            ->where('year', $year)
            ->orderBy('salary_from')
            ->get();
    }
}