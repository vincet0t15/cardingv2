<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $isMember = \Illuminate\Support\Facades\DB::table('conversation_user')
        ->where('conversation_id', $conversationId)
        ->where('user_id', $user->id)
        ->exists();

    return $isMember ? ['id' => $user->id, 'name' => $user->name] : false;
});

Broadcast::channel('messenger', function ($user) {
    return ['id' => $user->id, 'name' => $user->name];
});
