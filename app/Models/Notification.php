<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Auth;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'link',
        'notifiable_id',
        'notifiable_type',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    const TYPE_DELETE_REQUEST = 'delete_request';
    const TYPE_GENERAL = 'general';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }

    public function markAsRead(): void
    {
        $this->update(['is_read' => true]);
    }

    public static function notifyAdmins(string $type, string $title, string $message, ?string $link = null, ?Model $notifiable = null): void
    {
        $admins = User::role('admin')->get();

        foreach ($admins as $admin) {
            static::create([
                'user_id' => $admin->id,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'link' => $link,
                'notifiable_id' => $notifiable?->id,
                'notifiable_type' => $notifiable ? get_class($notifiable) : null,
            ]);
        }
    }

    public static function boot()
    {
        parent::boot();

        static::creating(function ($notification) {
            if (!$notification->user_id) {
                $notification->user_id = Auth::id();
            }
        });
    }
}