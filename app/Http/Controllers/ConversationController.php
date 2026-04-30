<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConversationController extends Controller
{
    public function index()
    {
        return Inertia::render('messenger', [
            'conversations' => $this->getConversations(),
            'users' => $this->getUsers(),
            'activeConversation' => null,
            'messages' => [],
        ]);
    }

    public function show(Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('user_id', auth()->id())->exists(),
            403
        );

        $messages = $conversation->messages()
            ->with('user:id,name')
            ->latest()
            ->take(50)
            ->get()
            ->reverse()
            ->values();

        $conversation->participants()->updateExistingPivot(auth()->id(), [
            'last_read_at' => now(),
        ]);

        return Inertia::render('messenger', [
            'conversations' => $this->getConversations(),
            'users' => $this->getUsers(),
            'activeConversation' => $conversation->load('participants:id,name,username'),
            'messages' => $messages,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'exists:users,id', 'different:auth.id'],
            'name' => ['nullable', 'string', 'max:255'],
            'is_group' => ['boolean'],
        ]);

        $userIds = $request->user_ids;
        $isGroup = $request->boolean('is_group', count($userIds) > 1);

        if (!$isGroup) {
            $existing = Conversation::query()
                ->where('is_group', false)
                ->whereHas('participants', fn($q) => $q->where('user_id', auth()->id()))
                ->whereHas('participants', fn($q) => $q->where('user_id', $userIds[0]))
                ->first();

            if ($existing) {
                return response()->json(['id' => $existing->id]);
            }
        }

        $conversation = Conversation::create([
            'name' => $isGroup ? $request->name : null,
            'is_group' => $isGroup,
            'created_by' => auth()->id(),
        ]);

        $participants = array_unique([auth()->id(), ...$userIds]);
        $conversation->participants()->attach($participants, ['last_read_at' => null]);

        return response()->json(['id' => $conversation->id]);
    }

    private function getConversations()
    {
        $userId = auth()->id();

        return auth()->user()->conversations()
            ->with([
                'participants:id,name,username',
                'latestMessage.user:id,name',
            ])
            ->withCount([
                'messages as unread_count' => fn($q) => $q
                    ->where('messages.user_id', '!=', $userId)
                    ->whereExists(
                        fn($sub) => $sub->from('conversation_user')
                            ->whereColumn('conversation_user.conversation_id', 'messages.conversation_id')
                            ->where('conversation_user.user_id', $userId)
                            ->where(
                                fn($w) => $w
                                    ->whereNull('conversation_user.last_read_at')
                                    ->orWhereColumn('messages.created_at', '>', 'conversation_user.last_read_at')
                            )
                    ),
            ])
            ->orderByDesc('updated_at')
            ->get();
    }

    private function getUsers()
    {
        return User::where('id', '!=', auth()->id())
            ->where('is_active', true)
            ->select('id', 'name', 'username')
            ->orderBy('name')
            ->get();
    }

    public function getMessages(Request $request, Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('user_id', auth()->id())->exists(),
            403
        );

        $before = $request->query('before');

        if (!$before) {
            $conversation->participants()->updateExistingPivot(auth()->id(), [
                'last_read_at' => now(),
            ]);

            $conversation->messages()
                ->where('user_id', '!=', auth()->id())
                ->whereNull('seen_at')
                ->update([
                    'seen_at' => now(),
                    'seen_by' => auth()->id(),
                ]);
        }

        $query = $conversation->messages()->with('user:id,name')->with('seenBy:id,name');

        if ($before) {
            $query->where('id', '<', $before);
        }

        $messages = $query->latest()->take(50)->get()->reverse()->values();

        return response()->json(['messages' => $messages]);
    }

    public function recent()
    {
        $userId = auth()->id();

        $conversations = auth()->user()->conversations()
            ->with([
                'participants:id,name,username',
                'latestMessage.user:id,name',
            ])
            ->withCount([
                'messages as unread_count' => fn($q) => $q
                    ->where('messages.user_id', '!=', $userId)
                    ->whereExists(
                        fn($sub) => $sub->from('conversation_user')
                            ->whereColumn('conversation_user.conversation_id', 'messages.conversation_id')
                            ->where('conversation_user.user_id', $userId)
                            ->where(
                                fn($w) => $w
                                    ->whereNull('conversation_user.last_read_at')
                                    ->orWhereColumn('messages.created_at', '>', 'conversation_user.last_read_at')
                            )
                    ),
            ])
            ->orderByDesc('updated_at')
            ->get();

        $totalUnread = (int) $conversations->sum('unread_count');

        $users = User::where('id', '!=', $userId)
            ->where('is_active', true)
            ->select('id', 'name', 'username')
            ->orderBy('name')
            ->get();

        return response()->json([
            'conversations' => $conversations,
            'users' => $users,
            'total_unread' => $totalUnread,
        ]);
    }
}
