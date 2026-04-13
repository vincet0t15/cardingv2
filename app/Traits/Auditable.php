<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            self::logAudit('created', $model, null, $model->getAttributes());
        });

        static::updated(function ($model) {
            $oldValues = array_intersect_key($model->getOriginal(), $model->getDirty());
            $newValues = $model->getDirty();

            if (! empty($newValues)) {
                self::logAudit('updated', $model, $oldValues, $newValues);
            }
        });

        static::deleted(function ($model) {
            self::logAudit('deleted', $model, $model->getOriginal(), null);
        });

        if (method_exists(static::class, 'restoring')) {
            static::restored(function ($model) {
                self::logAudit('restored', $model, null, $model->getAttributes());
            });
        }
    }

    protected static function logAudit(string $action, $model, ?array $oldValues, ?array $newValues): void
    {
        // Generate description if model has getAuditDescription method
        $description = null;
        if (method_exists($model, 'getAuditDescription')) {
            $description = $model->getAuditDescription($action, $oldValues, $newValues);
        }

        AuditLog::create([
            'action' => $action,
            'model_type' => get_class($model),
            'model_id' => $model->getKey(),
            'user_id' => Auth::id(),
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
        ]);
    }
}
