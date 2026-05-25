<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class WithholdingTaxTable extends Model
{
    use HasFactory;

    protected $table = 'withholding_tax_tables';

    protected $fillable = [
        'salary_from',
        'salary_to',
        'base_tax',
        'percentage_over',
        'excess_threshold',
        'tax_bracket',
        'year',
        'is_active',
    ];

    protected $casts = [
        'salary_from' => 'decimal:2',
        'salary_to' => 'decimal:2',
        'base_tax' => 'decimal:2',
        'percentage_over' => 'decimal:4',
        'excess_threshold' => 'decimal:2',
        'year' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the tax bracket for a given monthly salary
     */
    public static function getBracketForSalary(float $monthlySalary, ?int $year = null): ?self
    {
        $year = $year ?? now()->year;

        return static::where('is_active', true)
            ->where('year', $year)
            ->where('salary_from', '<=', $monthlySalary)
            ->where(function ($query) use ($monthlySalary) {
                $query->whereNull('salary_to')
                    ->orWhere('salary_to', '>=', $monthlySalary);
            })
            ->orderBy('salary_from', 'desc')
            ->first();
    }

    /**
     * Calculate monthly withholding tax for a given monthly salary
     * Uses BIR formula: Base Tax + (Percentage × Excess over Threshold)
     */
    public static function calculateMonthlyTax(float $monthlySalary, ?int $year = null): float
    {
        $bracket = static::getBracketForSalary($monthlySalary, $year);

        if (!$bracket) {
            return 0;
        }

        $baseTax = (float) $bracket->base_tax;
        $percentage = (float) $bracket->percentage_over;
        $threshold = (float) $bracket->excess_threshold;

        $excess = max(0, $monthlySalary - $threshold);
        $tax = $baseTax + ($excess * $percentage);

        return round($tax, 2);
    }

    /**
     * Calculate annual withholding tax
     */
    public static function calculateAnnualTax(float $annualSalary, ?int $year = null): float
    {
        $bracket = static::getBracketForSalary($annualSalary / 12, $year);

        if (!$bracket) {
            return 0;
        }

        $monthlyTax = static::calculateMonthlyTax($annualSalary / 12, $year);
        return round($monthlyTax * 12, 2);
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