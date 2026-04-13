<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class DeductionType extends Model
{
    use Auditable;
    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function employeeDeductions()
    {
        return $this->hasMany(EmployeeDeduction::class);
    }

    /**
     * Scope to get only active deduction types
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
