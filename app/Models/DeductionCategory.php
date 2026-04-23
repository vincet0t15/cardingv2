<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeductionCategory extends Model
{
    protected $fillable = [
        'name',
    ];

    public function deductionTypes()
    {
        return $this->hasMany(DeductionType::class, 'category_id');
    }
}
