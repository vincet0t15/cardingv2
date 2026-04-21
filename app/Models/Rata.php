<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class Rata extends Model
{
    use Auditable;

    protected $fillable = [
        'employee_id',
        'amount',
        'effective_date',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'effective_date' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function boot()
    {
        parent::boot();

        static::creating(function ($rata) {
            $rata->created_by = Auth::id();
        });
    }
}
