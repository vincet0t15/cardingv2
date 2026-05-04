import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LogOut, Plus, UserCheck, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const AVATAR_COLORS = ['bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-fuchsia-500'];

function avatarColor(id: number) {
    return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function csrfToken() {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

interface Member {
    id: number;
    name: string;
    username: string;
}

interface GroupMembersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conversationId: number;
    authUserId: number;
    creatorId?: number;
    onLeaveSuccess: () => void;
    onMemberAdded?: (member: Member) => void;
    onMemberRemoved?: (userId: number) => void;
}

export function GroupMembersDialog({
    open,
    onOpenChange,
    conversationId,
    authUserId,
    creatorId: initialCreatorId,
    onLeaveSuccess,
    onMemberAdded,
    onMemberRemoved,
}: GroupMembersDialogProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [creatorId, setCreatorId] = useState<number | null>(initialCreatorId ?? null);
    const [loading, setLoading] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableUsers, setAvailableUsers] = useState<Member[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [removingUserId, setRemovingUserId] = useState<number | null>(null);

    useEffect(() => {
        if (open && conversationId) {
            setLoading(true);
            fetch(`/messenger/${conversationId}/members`)
                .then((res) => res.json())
                .then((data) => {
                    setMembers(data.members);
                    setCreatorId(data.creator_id);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [open, conversationId]);

    // Fetch available users when showAddMember changes
    useEffect(() => {
        if (showAddMember && conversationId) {
            setSearchLoading(true);
            fetch(`/messenger/${conversationId}/available-users`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.users) {
                        setAvailableUsers(data.users);
                    } else {
                        setAvailableUsers([]);
                    }
                    setSearchLoading(false);
                })
                .catch(() => {
                    setAvailableUsers([]);
                    setSearchLoading(false);
                });
        } else {
            setAvailableUsers([]);
            setSearchQuery('');
        }
    }, [showAddMember, conversationId]);

    // Filter available users based on search query
    const filteredAvailableUsers = availableUsers.filter(
        (user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.username.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleLeave = async () => {
        setLeaving(true);
        try {
            const res = await fetch(`/messenger/${conversationId}/leave`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken() },
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Left the group chat');
                onOpenChange(false);
                onLeaveSuccess();
            } else {
                toast.error(data.error ?? 'Failed to leave group chat');
            }
        } catch {
            toast.error('Failed to leave group chat');
        } finally {
            setLeaving(false);
        }
    };

    const handleAddMember = async (userId: number) => {
        try {
            const res = await fetch(`/messenger/${conversationId}/members/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ user_id: userId }),
            });
            const data = await res.json();
            if (res.ok) {
                const newMember = availableUsers.find((u) => u.id === userId);
                if (newMember) {
                    setMembers([...members, newMember]);
                    setAvailableUsers(availableUsers.filter((u) => u.id !== userId));
                    onMemberAdded?.(newMember);
                }
                setSearchQuery('');
                toast.success('Member added successfully');
            } else {
                toast.error(data.error ?? 'Failed to add member');
            }
        } catch {
            toast.error('Failed to add member');
        }
    };

    const handleRemoveMember = async (userId: number) => {
        setRemovingUserId(userId);
        try {
            const res = await fetch(`/messenger/${conversationId}/members/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ user_id: userId }),
            });
            const data = await res.json();
            if (res.ok) {
                setMembers(members.filter((m) => m.id !== userId));
                onMemberRemoved?.(userId);
                toast.success('Member removed');
            } else {
                toast.error(data.error ?? 'Failed to remove member');
            }
        } catch {
            toast.error('Failed to remove member');
        } finally {
            setRemovingUserId(null);
        }
    };

    const isGroupAdmin = creatorId === authUserId;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[380px]">
                <div className="flex items-center justify-between">
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Members ({members.length})
                    </DialogTitle>
                    {isGroupAdmin && (
                        <Button size="sm" variant="outline" onClick={() => setShowAddMember(!showAddMember)} className="h-9 w-9 p-0">
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {showAddMember && (
                    <div className="space-y-2 border-b pb-3">
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="text-sm"
                        />
                        {searchLoading && (
                            <div className="flex justify-center py-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                            </div>
                        )}
                        {!searchLoading && availableUsers.length === 0 && (
                            <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-700/50">
                                <p className="text-muted-foreground text-xs">No users available to add</p>
                                <p className="text-muted-foreground text-xs">Everyone is already in the group</p>
                            </div>
                        )}
                        {!searchLoading && filteredAvailableUsers.length > 0 && (
                            <div className="space-y-1">
                                {filteredAvailableUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleAddMember(user.id)}
                                        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-blue-50 dark:hover:bg-slate-700"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{user.name}</p>
                                            <p className="text-muted-foreground truncate text-xs">@{user.username}</p>
                                        </div>
                                        <Plus className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                    </button>
                                ))}
                            </div>
                        )}
                        {!searchLoading && searchQuery.trim() && filteredAvailableUsers.length === 0 && availableUsers.length > 0 && (
                            <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-700/50">
                                <p className="text-muted-foreground text-xs">No users match your search</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="max-h-[320px] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {members.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                                    <div
                                        className={cn(
                                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                                            avatarColor(member.id),
                                        )}
                                    >
                                        {getInitials(member.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {member.name}
                                            {member.id === creatorId && (
                                                <span className="text-muted-foreground ml-1.5 text-[10px] font-normal">(admin)</span>
                                            )}
                                            {member.id === authUserId && <span className="ml-1.5 text-[10px] font-normal text-blue-500">(you)</span>}
                                        </p>
                                        <p className="text-muted-foreground truncate text-xs">@{member.username}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {member.id === authUserId && (
                                            <div className="flex h-5 w-5 shrink-0 items-center justify-center text-green-500">
                                                <UserCheck className="h-3.5 w-3.5" />
                                            </div>
                                        )}
                                        {isGroupAdmin && member.id !== authUserId && member.id !== creatorId && (
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                disabled={removingUserId === member.id}
                                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                                                title="Remove member"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t pt-4">
                    <button
                        onClick={handleLeave}
                        disabled={leaving}
                        className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                        <LogOut className="h-4 w-4" />
                        {leaving ? 'Leaving...' : 'Leave group chat'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
