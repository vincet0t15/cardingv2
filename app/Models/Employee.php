<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class Employee extends Model
{
    use Auditable, SoftDeletes;

    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'position',
        'is_rata_eligible',
        'employment_status_id',
        'office_id',
        'created_by',
        'image_path',
    ];

    protected $casts = [
        'is_rata_eligible' => 'boolean',
    ];

    public function employmentStatus(): BelongsTo
    {
        return $this->belongsTo(EmploymentStatus::class);
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function salaries(): HasMany
    {
        return $this->hasMany(Salary::class);
    }

    public function peras(): HasMany
    {
        return $this->hasMany(Pera::class);
    }

    public function ratas(): HasMany
    {
        return $this->hasMany(Rata::class);
    }

    public function hazardPays(): HasMany
    {
        return $this->hasMany(HazardPay::class);
    }

    public function clothingAllowances(): HasMany
    {
        return $this->hasMany(ClothingAllowance::class);
    }

    public function deductions(): HasMany
    {
        return $this->hasMany(EmployeeDeduction::class);
    }

    /**
     * Alias for deductions relationship
     */
    public function employeeDeductions(): HasMany
    {
        return $this->hasMany(EmployeeDeduction::class);
    }

    public function claims(): HasMany
    {
        return $this->hasMany(Claim::class);
    }

    /**
     * Get the latest salary record
     */
    public function latestSalary(): HasOne
    {
        return $this->hasOne(Salary::class)->latestOfMany('effective_date')->with('sourceOfFundCode');
    }

    /**
     * Get the latest PERA record
     */
    public function latestPera(): HasOne
    {
        return $this->hasOne(Pera::class)->latestOfMany('effective_date');
    }

    /**
     * Get the latest RATA record
     */
    public function latestRata(): HasOne
    {
        return $this->hasOne(Rata::class)->latestOfMany('effective_date');
    }

    /**
     * Get the latest Hazard Pay record
     */
    public function latestHazardPay(): HasOne
    {
        return $this->hasOne(HazardPay::class)->latestOfMany('effective_date');
    }

    /**
     * Get the latest Clothing Allowance record
     */
    public function latestClothingAllowance(): HasOne
    {
        return $this->hasOne(ClothingAllowance::class)->latestOfMany('effective_date');
    }

    public static function boot()
    {
        parent::boot();

        static::creating(function ($employee) {
            $employee->created_by = Auth::id();
        });
    }

    public function getImagePathAttribute($value)
    {
        return $value ? Storage::url($value) : null;
    }
}
