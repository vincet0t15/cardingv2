import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { LogOut, UserCheck, Users } from 'lucide-react';
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
    onLeaveSuccess: () => void;
}

export function GroupMembersDialog({ open, onOpenChange, conversationId, authUserId, onLeaveSuccess }: GroupMembersDialogProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [creatorId, setCreatorId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [leaving, setLeaving] = useState(false);

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[380px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Members ({members.length})
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[320px] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-3 rounded-lg px-2 py-2"
                                >
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
                                                <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(admin)</span>
                                            )}
                                            {member.id === authUserId && (
                                                <span className="ml-1.5 text-[10px] font-normal text-blue-500">(you)</span>
                                            )}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">@{member.username}</p>
                                    </div>
                                    {member.id === authUserId && (
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center text-green-500">
                                            <UserCheck className="h-3.5 w-3.5" />
                                        </div>
                                    )}
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
