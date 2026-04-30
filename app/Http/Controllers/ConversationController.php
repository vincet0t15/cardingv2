<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
            $conversation->participants()->where('user_id', Auth::id())->exists(),
            403
        );

        $messages = $conversation->messages()
            ->with('user:id,name')
            ->with('replyTo:id,body,user_id')
            ->with('replyTo.user:id,name')
            ->latest()
            ->take(50)
            ->get()
            ->reverse()
            ->values();

        $conversation->participants()->updateExistingPivot(Auth::id(), [
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
                ->whereHas('participants', fn($q) => $q->where('user_id', Auth::id()))
                ->whereHas('participants', fn($q) => $q->where('user_id', $userIds[0]))
                ->first();

            if ($existing) {
                return response()->json(['id' => $existing->id]);
            }
        }

        $conversation = Conversation::create([
            'name' => $isGroup ? $request->name : null,
            'is_group' => $isGroup,
            'created_by' => Auth::id(),
        ]);

        $participants = array_unique([Auth::id(), ...$userIds]);
        $conversation->participants()->attach($participants, ['last_read_at' => null]);

        return response()->json(['id' => $conversation->id]);
    }

    private function getConversations()
    {
        $userId = Auth::id();

        $conversations = auth()->user()->conversations()
            ->with([
                'participants:id,name,username',
                'latestMessage.user:id,name',
            ])
            ->orderByDesc('updated_at')
            ->get();

        // Calculate unread count for each conversation using raw query
        foreach ($conversations as $conversation) {
            $userInConv = DB::table('conversation_user')
                ->where('conversation_id', $conversation->id)
                ->where('user_id', $userId)
                ->first();

            $lastReadAt = $userInConv?->last_read_at;

            $query = DB::table('messages')
                ->where('conversation_id', $conversation->id)
                ->where('user_id', '!=', $userId);

            if ($lastReadAt) {
                $query->where('created_at', '>', $lastReadAt);
            }

            $conversation->unread_count = $query->count();
        }

        return $conversations;
    }

    private function getUsers()
    {
        return User::where('id', '!=', Auth::id())
            ->where('is_active', true)
            ->select('id', 'name', 'username')
            ->orderBy('name')
            ->get();
    }

    public function paginatedUsers(Request $request)
    {
        $page = (int) $request->query('page', 1);
        $perPage = 15;

        $users = User::where('id', '!=', Auth::id())
            ->where('is_active', true)
            ->select('id', 'name', 'username')
            ->orderBy('name')
            ->skip(($page - 1) * $perPage)
            ->take($perPage + 1)
            ->get();

        $hasMore = $users->count() > $perPage;
        if ($hasMore) {
            $users = $users->take($perPage);
        }

        return response()->json([
            'users' => $users->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
            ])->values(),
            'has_more' => $hasMore,
        ]);
    }

    public function paginatedConversations(Request $request)
    {
        $page = (int) $request->query('page', 1);
        $perPage = 15;

        $conversations = auth()->user()->conversations()
            ->with([
                'participants:id,name,username',
                'latestMessage.user:id,name',
            ])
            ->orderByDesc('updated_at')
            ->skip(($page - 1) * $perPage)
            ->take($perPage + 1)
            ->get();

        $hasMore = $conversations->count() > $perPage;
        if ($hasMore) {
            $conversations = $conversations->take($perPage);
        }

        $userId = Auth::id();
        $data = [];

        foreach ($conversations as $conversation) {
            $userInConv = DB::table('conversation_user')
                ->where('conversation_id', $conversation->id)
                ->where('user_id', $userId)
                ->first();

            $lastReadAt = $userInConv?->last_read_at;

            $query = DB::table('messages')
                ->where('conversation_id', $conversation->id)
                ->where('user_id', '!=', $userId);

            if ($lastReadAt) {
                $query->where('created_at', '>', $lastReadAt);
            }

            $unreadCount = $query->count();

            $convData = [
                'id' => $conversation->id,
                'name' => $conversation->name,
                'is_group' => (bool) $conversation->is_group,
                'participants' => $conversation->participants->map(fn($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'username' => $p->username,
                ])->values()->toArray(),
                'unread_count' => $unreadCount,
                'updated_at' => $conversation->updated_at,
            ];

            if ($conversation->latestMessage) {
                $convData['latest_message'] = [
                    'id' => $conversation->latestMessage->id,
                    'body' => $conversation->latestMessage->body,
                    'created_at' => $conversation->latestMessage->created_at,
                    'user' => [
                        'id' => $conversation->latestMessage->user->id,
                        'name' => $conversation->latestMessage->user->name,
                    ],
                ];
            }

            $data[] = $convData;
        }

        return response()->json([
            'conversations' => $data,
            'has_more' => $hasMore,
        ]);
    }

    public function getMessages(Request $request, Conversation $conversation)
    {
        abort_unless(
            $conversation->participants()->where('user_id', Auth::id())->exists(),
            403
        );

        $before = $request->query('before');

        if (!$before) {
            $conversation->participants()->updateExistingPivot(Auth::id(), [
                'last_read_at' => now(),
            ]);

            $conversation->messages()
                ->where('user_id', '!=', Auth::id())
                ->whereNull('seen_at')
                ->update([
                    'seen_at' => now(),
                    'seen_by' => Auth::id(),
                ]);
        }

        $query = $conversation->messages()
            ->with('user:id,name')
            ->with('seenBy:id,name')
            ->with('replyTo:id,body,user_id')
            ->with('replyTo.user:id,name');

        if ($before) {
            $query->where('id', '<', $before);
        }

        $messages = $query->latest()->take(50)->get()->reverse()->values();

        return response()->json(['messages' => $messages]);
    }

    public function recent()
    {
        try {
            $userId = Auth::id();

            // Get conversations for this user
            $conversationIds = DB::table('conversation_user')
                ->where('user_id', $userId)
                ->pluck('conversation_id');

            if ($conversationIds->isEmpty()) {
                return response()->json([
                    'conversations' => [],
                    'users' => [],
                    'total_unread' => 0,
                ]);
            }

            // Get conversation details
            $conversations = DB::table('conversations')
                ->whereIn('id', $conversationIds)
                ->orderByDesc('updated_at')
                ->get();

            $conversationData = [];
            $totalUnread = 0;

            foreach ($conversations as $conversation) {
                // Get participants
                $participants = DB::table('users')
                    ->join('conversation_user', 'users.id', '=', 'conversation_user.user_id')
                    ->where('conversation_user.conversation_id', $conversation->id)
                    ->select('users.id', 'users.name', 'users.username')
                    ->get();

                // Get unread count
                $userInConv = DB::table('conversation_user')
                    ->where('conversation_id', $conversation->id)
                    ->where('user_id', $userId)
                    ->first();

                $lastReadAt = $userInConv?->last_read_at;

                $query = DB::table('messages')
                    ->where('conversation_id', $conversation->id)
                    ->where('user_id', '!=', $userId);

                if ($lastReadAt) {
                    $query->where('created_at', '>', $lastReadAt);
                }

                $unreadCount = $query->count();
                $totalUnread += $unreadCount;

                // Get latest message
                $latestMessage = DB::table('messages')
                    ->join('users', 'messages.user_id', '=', 'users.id')
                    ->where('conversation_id', $conversation->id)
                    ->select('messages.id', 'messages.body', 'messages.created_at', 'users.id as user_id', 'users.name as user_name')
                    ->orderByDesc('messages.created_at')
                    ->first();

                // Build conversation data
                $convData = [
                    'id' => $conversation->id,
                    'name' => $conversation->name,
                    'is_group' => (bool) $conversation->is_group,
                    'participants' => $participants->map(fn($p) => [
                        'id' => $p->id,
                        'name' => $p->name,
                        'username' => $p->username,
                    ])->values()->toArray(),
                    'unread_count' => $unreadCount,
                    'updated_at' => (string) $conversation->updated_at,
                ];

                if ($latestMessage) {
                    $convData['latest_message'] = [
                        'id' => $latestMessage->id,
                        'body' => $latestMessage->body,
                        'created_at' => (string) $latestMessage->created_at,
                        'user' => [
                            'id' => $latestMessage->user_id,
                            'name' => $latestMessage->user_name,
                        ],
                    ];
                }

                $conversationData[] = $convData;
            }

            // Get users
            $users = DB::table('users')
                ->where('id', '!=', $userId)
                ->where('is_active', true)
                ->select('id', 'name', 'username')
                ->orderBy('name')
                ->get()
                ->map(fn($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                ])->values()->toArray();

            return response()->json([
                'conversations' => $conversationData,
                'users' => $users,
                'total_unread' => $totalUnread,
            ]);
        } catch (\Exception $e) {
            Log::error('Messenger recent error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }
    }

    public function leave(Conversation $conversation)
    {
        abort_unless($conversation->is_group, 400);
        abort_unless(
            $conversation->participants()->where('user_id', Auth::id())->exists(),
            403
        );

        $participantCount = $conversation->participants()->count();
        if ($participantCount <= 2) {
            return response()->json(['error' => 'Cannot leave a group with less than 3 members. Delete the chat instead.'], 400);
        }

        $conversation->participants()->detach(Auth::id());

        return response()->json(['success' => true]);
    }

    public function members(Conversation $conversation)
    {
        abort_unless(
            $conversation->is_group && $conversation->participants()->where('user_id', Auth::id())->exists(),
            403
        );

        $participants = $conversation->participants()
            ->select('users.id', 'users.name', 'users.username')
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
            ]);

        return response()->json([
            'members' => $participants,
            'creator_id' => $conversation->created_by,
        ]);
    }
}
