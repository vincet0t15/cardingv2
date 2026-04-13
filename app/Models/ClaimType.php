<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClaimType extends Model
{
    use Auditable, HasFactory;

    protected $fillable = ['name', 'code', 'description', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function claims()
    {
        return $this->hasMany(Claim::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
