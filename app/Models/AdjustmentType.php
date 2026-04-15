<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AdjustmentType extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'name',
        'description',
        'effect',
        'taxable',
        'include_in_payroll',
        'requires_approval',
        'restricted_roles',
        'created_by',
    ];

    protected $casts = [
        'effect' => 'string',
        'taxable' => 'boolean',
        'include_in_payroll' => 'boolean',
        'requires_approval' => 'boolean',
    ];

    public function adjustments(): HasMany
    {
        return $this->hasMany(Adjustment::class, 'adjustment_type', 'name');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopePositive($query)
    {
        return $query->where('effect', 'positive');
    }

    public function scopeNegative($query)
    {
        return $query->where('effect', 'negative');
    }
}
