<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GeneralFund extends Model
{
    protected $fillable = [
        'code',
        'description',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function sourceOfFundCodes(): HasMany
    {
        return $this->hasMany(SourceOfFundCode::class);
    }
}
