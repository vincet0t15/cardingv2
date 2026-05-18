<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Claim extends Model
{
    use Auditable, HasFactory;

    protected $fillable = [
        'employee_id',
        'salary_id',
        'claim_type_id',
        'claim_date',
        'amount',
        'purpose',
        'remarks',
    ];

    protected $casts = [
        'claim_date' => 'date',
        'amount' => 'decimal:2',
    ];

    protected $with = ['salary', 'claimType'];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function salary(): BelongsTo
    {
        return $this->belongsTo(Salary::class);
    }

    public function claimType(): BelongsTo
    {
        return $this->belongsTo(ClaimType::class);
    }
}
