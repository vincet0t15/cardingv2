<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class EmployeeDeduction extends Model
{
    use Auditable;

    protected $fillable = [
        'employee_id',
        'salary_id',
        'deduction_type_id',
        'amount',
        'pay_period_month',
        'pay_period_year',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'pay_period_month' => 'integer',
        'pay_period_year' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function salary(): BelongsTo
    {
        return $this->belongsTo(Salary::class);
    }

    public function deductionType(): BelongsTo
    {
        return $this->belongsTo(DeductionType::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function boot()
    {
        parent::boot();

        static::creating(function ($deduction) {
            $deduction->created_by = Auth::id();
        });
    }

    /**
     * Scope to filter by pay period
     */
    public function scopeForPeriod($query, int $month, int $year)
    {
        return $query->where('pay_period_month', $month)
            ->where('pay_period_year', $year);
    }
}
