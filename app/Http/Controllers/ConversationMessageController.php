<?php

namespace App\Http\Controllers;

use App\Events\ConversationMessageDeleted;
use App\Events\ConversationMessageSent;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ConversationMessageController extends Controller
{
    public function store(Request $request, Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('user_id', auth()->id())->exists(),
            403
        );

        $request->validate([
            'body' => ['nullable', 'string', 'max:5000'],
            'file' => ['nullable', 'file', 'max:10240'],
            'reply_to_id' => ['nullable', 'integer', 'exists:messages,id'],
        ]);

        if (!$request->filled('body') && !$request->hasFile('file')) {
            return response()->json(['error' => 'A message or file is required'], 422);
        }

        try {
            $data = [
                'user_id' => auth()->id(),
                'body' => $request->input('body', ''),
                'reply_to_id' => $request->input('reply_to_id'),
            ];

            // Handle file upload
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $fileName = $file->getClientOriginalName();
                $filePath = $file->store('messages', 'public');
                $fileType = $file->getClientOriginalExtension();
                $fileSize = $file->getSize();
                $mimeType = $file->getMimeType();

                $data['file_name'] = $fileName;
                $data['file_path'] = $filePath;
                $data['file_type'] = $fileType;
                $data['file_size'] = $fileSize;
                $data['mime_type'] = $mimeType;
            }

            $message = $conversation->messages()->create($data);

            $message->load('user:id,name', 'replyTo.user:id,name');

            $conversation->touch();

            $conversation->participants()->updateExistingPivot(auth()->id(), [
                'last_read_at' => now(),
            ]);

            try {
                broadcast(new ConversationMessageSent($message))->toOthers();
            } catch (\Throwable $e) {
                report($e);
            }

            return response()->json([
                'message' => [
                    'id' => $message->id,
                    'body' => $message->body,
                    'reply_to_id' => $message->reply_to_id,
                    'reply_to' => $message->replyTo ? [
                        'id' => $message->replyTo->id,
                        'body' => $message->replyTo->body,
                        'user' => ['id' => $message->replyTo->user->id, 'name' => $message->replyTo->user->name],
                    ] : null,
                    'file_name' => $message->file_name,
                    'file_path' => $message->file_path,
                    'file_type' => $message->file_type,
                    'file_size' => $message->file_size,
                    'mime_type' => $message->mime_type,
                    'created_at' => $message->created_at->toISOString(),
                    'seen_at' => $message->seen_at?->toISOString(),
                    'seen_by' => $message->seen_by,
                    'user' => [
                        'id' => $message->user->id,
                        'name' => $message->user->name,
                    ],
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Message store failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'conversation_id' => $conversation->id,
                'request' => $request->except(['file']),
            ]);

            return response()->json([
                'error' => 'Failed to send message',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function markRead(Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('user_id', auth()->id())->exists(),
            403
        );

        $conversation->participants()->updateExistingPivot(auth()->id(), [
            'last_read_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    public function markSeen(Conversation $conversation, Message $message)
    {
        abort_unless(
            $conversation->participants()->where('user_id', auth()->id())->exists(),
            403
        );

        abort_unless($message->conversation_id === $conversation->id, 403);

        if (!$message->seen_at && $message->user_id !== auth()->id()) {
            $message->update([
                'seen_at' => now(),
                'seen_by' => auth()->id(),
            ]);
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(Conversation $conversation, Message $message)
    {
        abort_unless(
            $conversation->participants()->where('user_id', auth()->id())->exists(),
            403
        );
        abort_unless($message->conversation_id === $conversation->id, 403);
        abort_unless($message->user_id === auth()->id(), 403);

        // Delete uploaded file if present
        if ($message->file_path) {
            Storage::disk('public')->delete($message->file_path);
        }

        $message->delete();

        try {
            broadcast(new ConversationMessageDeleted($conversation->id, $message->id))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['ok' => true]);
    }
}
