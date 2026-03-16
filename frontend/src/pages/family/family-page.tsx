import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/constants';
import { useAuthStore } from '@/store/auth-store';
import { useAccounts } from '@/hooks/use-accounts';
import {
  useFamilyGroups,
  useGroupMembers,
  useSharedAccounts,
  useCreateGroup,
  useDeleteGroup,
  useInviteMember,
  useRemoveMember,
  useLeaveGroup,
  useShareAccount,
  useUnshareAccount,
} from '@/hooks/use-family';
import {
  Users,
  Plus,
  UserPlus,
  Trash2,
  LogOut,
  ChevronRight,
  Wallet,
  Share2,
  Crown,
  X,
} from 'lucide-react';

export default function FamilyPage() {
  const user = useAuthStore((s) => s.user);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const { data: groups, isLoading: groupsLoading } = useFamilyGroups();
  const { data: members } = useGroupMembers(selectedGroupId);
  const { data: sharedAccounts } = useSharedAccounts(selectedGroupId);
  const { data: myAccounts } = useAccounts();

  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();
  const leaveGroup = useLeaveGroup();
  const shareAccount = useShareAccount();
  const unshareAccount = useUnshareAccount();

  const selectedGroup = groups?.find((g) => g.id === selectedGroupId);
  const isOwner = selectedGroup?.ownerId === user?.id;

  // Accounts not yet shared with this group
  const unshaредAccounts = myAccounts?.filter(
    (acc) => !sharedAccounts?.some((sa) => sa.accountId === acc.id),
  );

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;
    createGroup.mutate({ name: groupName.trim() }, {
      onSuccess: () => {
        setGroupName('');
        setCreateDialogOpen(false);
      },
    });
  };

  const handleInvite = () => {
    if (!inviteEmail.trim() || !selectedGroupId) return;
    inviteMember.mutate(
      { groupId: selectedGroupId, data: { email: inviteEmail.trim() } },
      {
        onSuccess: () => {
          setInviteEmail('');
          setInviteDialogOpen(false);
        },
      },
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Family Sharing</h1>
          <p className="text-sm text-muted-foreground">
            Manage family groups and shared accounts
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Family Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
              />
              <Button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || createGroup.isPending}
                className="w-full"
              >
                {createGroup.isPending ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groupsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !groups?.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No family groups yet. Create one to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors',
                      selectedGroupId === group.id
                        ? 'bg-primary/20 ring-1 ring-primary'
                        : 'hover:bg-white/10',
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{group.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.memberCount} member{group.memberCount !== 1 ? 's' : ''} · {group.ownerName}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group Detail - Members */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Members</CardTitle>
              {selectedGroupId && (
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                      <UserPlus className="h-3.5 w-3.5" />
                      Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                      />
                      <Button
                        onClick={handleInvite}
                        disabled={!inviteEmail.trim() || inviteMember.isPending}
                        className="w-full"
                      >
                        {inviteMember.isPending ? 'Inviting...' : 'Send Invite'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedGroupId ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Select a group to view members</p>
              </div>
            ) : !members?.length ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-1">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-xs font-bold text-primary">
                        {member.fullName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{member.fullName}</p>
                        {member.role === 'OWNER' && (
                          <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    {isOwner && member.role !== 'OWNER' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500"
                        onClick={() =>
                          removeMember.mutate({ groupId: selectedGroupId!, memberId: member.id })
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}

                {/* Group actions */}
                <div className="pt-3 mt-3 border-t border-white/10 space-y-2">
                  {!isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => {
                        leaveGroup.mutate(selectedGroupId!);
                        setSelectedGroupId(null);
                      }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Leave Group
                    </Button>
                  )}
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => {
                        deleteGroup.mutate(selectedGroupId!);
                        setSelectedGroupId(null);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Group
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shared Accounts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Shared Accounts</CardTitle>
              {selectedGroupId && (
                <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 pt-2">
                      {!unshaредAccounts?.length ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          All your accounts are already shared with this group.
                        </p>
                      ) : (
                        unshaредAccounts.map((acc) => (
                          <button
                            key={acc.id}
                            onClick={() => {
                              shareAccount.mutate(
                                { groupId: selectedGroupId!, data: { accountId: acc.id } },
                                { onSuccess: () => setShareDialogOpen(false) },
                              );
                            }}
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-white/10 transition-colors text-left"
                          >
                            <Wallet className="h-4 w-4 text-primary" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{acc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(acc.balance, acc.currency)}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedGroupId ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Wallet className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a group to view shared accounts
                </p>
              </div>
            ) : !sharedAccounts?.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Share2 className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No accounts shared yet. Share an account to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {sharedAccounts.map((sa) => (
                  <div
                    key={sa.accountId}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: sa.color ? `${sa.color}20` : 'var(--color-muted)',
                      }}
                    >
                      <Wallet
                        className="h-4 w-4"
                        style={{ color: sa.color ?? 'var(--color-muted-foreground)' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sa.accountName}</p>
                      <p className="text-xs text-muted-foreground">
                        {sa.ownerName} · {sa.accountType}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {formatCurrency(sa.balance, sa.currency)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-red-400"
                        onClick={() =>
                          unshareAccount.mutate({
                            groupId: selectedGroupId!,
                            accountId: sa.accountId,
                          })
                        }
                      >
                        Unshare
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
