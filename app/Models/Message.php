<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Message extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'body',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'mime_type',
        'seen_at',
        'seen_by',
        'conversation_id',
        'user_id',
        'reply_to_id',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'seen_at' => 'datetime',
        'file_size' => 'integer',
    ];

    /**
     * Get the user who sent the message.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the conversation the message belongs to.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the user who saw the message.
     */
    public function seenBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seen_by');
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }

    /**
     * Check if the message has an attachment.
     */
    public function hasAttachment(): Attribute
    {
        return Attribute::make(
            get: fn() => !empty($this->file_path),
        );
    }

    /**
     * Get the file extension.
     */
    public function fileExtension(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->file_type ? strtolower($this->file_type) : null,
        );
    }

    /**
     * Check if the file is an image.
     */
    public function is_image(): Attribute
    {
        return Attribute::make(
            get: fn() =>
            !empty($this->mime_type) &&
                str_starts_with($this->mime_type, 'image/'),
        );
    }

    /**
     * Check if the file is a PDF.
     */
    public function is_pdf(): Attribute
    {
        return Attribute::make(
            get: fn() =>
            !empty($this->mime_type) &&
                $this->mime_type === 'application/pdf',
        );
    }
}
