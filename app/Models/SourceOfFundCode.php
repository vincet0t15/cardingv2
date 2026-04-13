<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SourceOfFundCode extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'description',
        'status',
        'parent_id',
        'is_category',
        'general_fund_id',
    ];

    protected $casts = [
        'status' => 'boolean',
        'is_category' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(SourceOfFundCode::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(SourceOfFundCode::class, 'parent_id');
    }

    public function fundCategories(): HasMany
    {
        return $this->hasMany(SourceOfFundCode::class, 'parent_id');
    }

    public function fundCodes(): HasMany
    {
        return $this->hasMany(SourceOfFundCode::class, 'parent_id');
    }

    public function generalFund(): BelongsTo
    {
        return $this->belongsTo(GeneralFund::class);
    }

    public function salaries(): HasMany
    {
        return $this->hasMany(Salary::class, 'source_of_fund_code_id');
    }
}
