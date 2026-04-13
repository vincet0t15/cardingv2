<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Salary extends Model
{
    use Auditable, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'amount',
        'effective_date',
        'end_date',
        'created_by',
        'source_of_fund_code_id',

    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'effective_date' => 'date',
        'end_date' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function sourceOfFundCode(): BelongsTo
    {
        return $this->belongsTo(SourceOfFundCode::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
