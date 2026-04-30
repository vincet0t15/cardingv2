<?php

namespace App\Http\Controllers;

use App\Events\ConversationMessageSent;
use App\Models\Conversation;
use Illuminate\Http\Request;

class ConversationMessageController extends Controller
{
    public function store(Request $request, Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('user_id', auth()->id())->exists(),
            403
        );

        $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $message = $conversation->messages()->create([
            'user_id' => auth()->id(),
            'body' => $request->input('body'),
        ]);

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
