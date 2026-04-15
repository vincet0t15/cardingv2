<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class Adjustment extends Model
{
    use Auditable, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'adjustment_type_id',
        'adjustment_type', // Keep for backward compatibility
        'amount',
        'currency',
        'pay_period_month',
        'pay_period_year',
        'effectivity_date',
        'reference_id',
        'reference_type_id',
        'reference_type', // Keep for backward compatibility
        'status',
        'approved_by',
        'approved_at',
        'reason',
        'remarks',
        'created_by',
        'processed_at',
        'processed_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'pay_period_month' => 'integer',
        'pay_period_year' => 'integer',
        'effectivity_date' => 'date',
        'approved_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    // Adjustment Types
    const TYPE_SALARY_REFUND = 'Salary Refund';
    const TYPE_UNDERPAYMENT = 'Underpayment';
    const TYPE_OVERTIME = 'Overtime Adjustment';
    const TYPE_LATE = 'Late Adjustment';
    const TYPE_DEDUCTION_REFUND = 'Deduction Refund';
    const TYPE_CORRECTION = 'Correction';
    const TYPE_ABSENCE = 'Absence Adjustment';
    const TYPE_HOLIDAY = 'Holiday Pay Adjustment';

    // Status
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_PROCESSED = 'processed';

    public static function getAdjustmentTypes(): array
    {
        return [
            self::TYPE_SALARY_REFUND,
            self::TYPE_UNDERPAYMENT,
            self::TYPE_OVERTIME,
            self::TYPE_LATE,
            self::TYPE_DEDUCTION_REFUND,
            self::TYPE_CORRECTION,
            self::TYPE_ABSENCE,
            self::TYPE_HOLIDAY,
        ];
    }

    // Relationships
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function adjustmentType(): BelongsTo
    {
        return $this->belongsTo(AdjustmentType::class);
    }

    public function referenceType(): BelongsTo
    {
        return $this->belongsTo(ReferenceType::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    public function scopeProcessed($query)
    {
        return $query->where('status', self::STATUS_PROCESSED);
    }

    public function scopeForPeriod($query, int $month, int $year)
    {
        return $query->where('pay_period_month', $month)
            ->where('pay_period_year', $year);
    }

    public function scopeForEmployee($query, int $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('adjustment_type', $type);
    }

    // Helper methods
    public function isPositive(): bool
    {
        return $this->amount > 0;
    }

    public function isNegative(): bool
    {
        return $this->amount < 0;
    }

    public function getDisplayAmount(): string
    {
        $prefix = $this->isPositive() ? '+' : '';
        return $prefix . number_format($this->amount, 2);
    }

    public static function boot()
    {
        parent::boot();

        static::creating(function ($adjustment) {
            $adjustment->created_by = Auth::id();
            if (!$adjustment->status) {
                $adjustment->status = self::STATUS_PENDING;
            }
        });
    }
}
