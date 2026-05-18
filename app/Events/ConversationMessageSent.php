<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class ConversationMessageSent implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('conversation.' . $this->message->conversation_id);
    }

    public function broadcastWith(): array
    {
        return [
            'message' => [
                'id' => $this->message->id,
                'body' => $this->message->body,
                'created_at' => $this->message->created_at->toISOString(),
                'user' => [
                    'id' => $this->message->user->id,
                    'name' => $this->message->user->name,
                ],
                'file_name' => $this->message->file_name,
                'file_path' => $this->message->file_path,
                'file_type' => $this->message->file_type,
                'file_size' => $this->message->file_size,
                'mime_type' => $this->message->mime_type,
                'is_image' => !empty($this->message->mime_type) && str_starts_with($this->message->mime_type, 'image/'),
                'is_pdf' => !empty($this->message->mime_type) && $this->message->mime_type === 'application/pdf',
                'reply_to_id' => $this->message->reply_to_id,
                'seen_at' => $this->message->seen_at,
                'seen_by' => $this->message->seen_by,
            ],
        ];
    }
}
