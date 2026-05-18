<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $fillable = [
        'action',
        'model_type',
        'model_id',
        'user_id',
        'description',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the model that was audited (polymorphic relationship)
     */
    public function auditable()
    {
        return $this->morphTo();
    }

    /**
     * Get human-readable action description
     */
    public function getActionDescriptionAttribute(): string
    {
        $modelClass = class_basename($this->model_type);

        return match ($this->action) {
            'created' => "Created {$modelClass}",
            'updated' => "Updated {$modelClass}",
            'deleted' => "Deleted {$modelClass}",
            'restored' => "Restored {$modelClass}",
            default => ucfirst($this->action) . ' ' . $modelClass,
        };
    }

    /**
     * Get formatted old values
     */
    public function getFormattedOldValuesAttribute(): array
    {
        return $this->formatValues($this->old_values ?? []);
    }

    /**
     * Get formatted new values
     */
    public function getFormattedNewValuesAttribute(): array
    {
        return $this->formatValues($this->new_values ?? []);
    }

    /**
     * Format values for display
     */
    protected function formatValues(array $values): array
    {
        $formatted = [];

        foreach ($values as $key => $value) {
            // Skip sensitive fields
            if (in_array($key, ['password', 'remember_token'])) {
                continue;
            }

            // Format booleans
            if (is_bool($value)) {
                $value = $value ? 'Yes' : 'No';
            }

            // Format null values
            if (is_null($value)) {
                $value = 'N/A';
            }

            // Format arrays/objects
            if (is_array($value) || is_object($value)) {
                $value = json_encode($value, JSON_PRETTY_PRINT);
            }

            $formatted[$key] = $value;
        }

        return $formatted;
    }

    /**
     * Get CSS class for action badge
     */
    public function getActionBadgeClassAttribute(): string
    {
        return match ($this->action) {
            'created' => 'bg-green-100 text-green-800',
            'updated' => 'bg-blue-100 text-blue-800',
            'deleted' => 'bg-red-100 text-red-800',
            'restored' => 'bg-purple-100 text-purple-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }
}
