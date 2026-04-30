<?php

namespace App\Http\Controllers;

use App\Events\ConversationMessageSent;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            'body' => ['required_without:file', 'nullable', 'string', 'max:5000'],
            'file' => ['required_without:body', 'nullable', 'file', 'max:10240'], // 10MB max
        ]);

        $data = [
            'user_id' => auth()->id(),
            'body' => $request->input('body'),
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

        $message->load('user:id,name');

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
}
