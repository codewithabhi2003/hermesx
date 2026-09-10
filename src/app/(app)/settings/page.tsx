'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAsync } from '@/hooks/useAsync';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';
import { getWorkspace, updateWorkspace } from '@/services/api/workspace.api';
import { listUsers, createUser, updateUser, deleteUser } from '@/services/api/users.api';
import { getProfile, updateProfile, changePassword } from '@/services/api/profile.api';
import { setAvatarUrl as setGlobalAvatarUrl } from '@/hooks/useAvatar';
import { ApiClientError } from '@/services/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { AvatarUpload } from '@/components/settings/AvatarUpload';
import { cn } from '@/lib/utils';
import type { Role, UserDto } from '@/types';

type Tab = 'profile' | 'workspace' | 'team' | 'appearance';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'ANALYST', label: 'Analyst' },
  { value: 'VIEWER', label: 'Viewer' },
];

function ProfileTab() {
  const { toast } = useToast();
  const { update: updateSession } = useSession();
  const profile = useAsync(() => getProfile(), []);

  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (profile.error) return <ErrorState message={profile.error.message} onRetry={profile.refetch} />;
  if (profile.isLoading || !profile.data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  const currentName = name ?? profile.data.name;
  const currentEmail = email ?? profile.data.email;
  const currentAvatarUrl = avatarUrl === undefined ? profile.data.avatarUrl : avatarUrl;
  const hasChanges =
    currentName !== profile.data.name ||
    currentEmail !== profile.data.email ||
    currentAvatarUrl !== profile.data.avatarUrl;

  const handleSaveProfile = async () => {
    setProfileError(null);
    if (!currentName.trim()) {
      setProfileError('Name is required.');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateProfile({ name: currentName, email: currentEmail, avatarUrl: currentAvatarUrl });
      // Name/email are small — safe to refresh via the session (cookie).
      // Avatar is NEVER put through the session (see hooks/useAvatar.ts for
      // why) — it updates the separate, cookie-free avatar store instead.
      await updateSession({ name: updated.name, email: updated.email });
      setGlobalAvatarUrl(updated.avatarUrl);
      toast.success('Profile updated.');
      setName(null);
      setEmail(null);
      setAvatarUrl(undefined);
      profile.refetch();
    } catch (error) {
      setProfileError(error instanceof ApiClientError ? error.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (!currentPassword || newPassword.length < 8) {
      setPasswordError('Current password and a new password of at least 8 characters are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match.");
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success('Password changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error instanceof ApiClientError ? error.message : 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <AvatarUpload name={currentName} avatarUrl={currentAvatarUrl} onChange={setAvatarUrl} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Name" value={currentName} onChange={(e) => setName(e.target.value)} required />
            <Input
              label="Email"
              type="email"
              value={currentEmail}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {profileError && <p className="text-sm text-negative">{profileError}</p>}

          <div className="flex justify-end">
            <Button variant="primary" onClick={handleSaveProfile} loading={isSaving} disabled={!hasChanges}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="New password"
              type="password"
              hint="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {passwordError && <p className="text-sm text-negative">{passwordError}</p>}

          <div className="flex justify-end">
            <Button variant="primary" onClick={handleChangePassword} loading={isChangingPassword}>
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkspaceTab() {
  const { toast } = useToast();
  const workspace = useAsync(() => getWorkspace(), []);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (workspace.error) return <ErrorState message={workspace.error.message} onRetry={workspace.refetch} />;
  if (workspace.isLoading || !workspace.data) return <Skeleton className="h-40" />;

  const currentName = name || workspace.data.name;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateWorkspace(currentName);
      toast.success('Workspace updated.');
      workspace.refetch();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to update workspace.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input label="Workspace name" defaultValue={workspace.data.name} onChange={(e) => setName(e.target.value)} />
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleSave} loading={isSaving}>
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamTab() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const users = useAsync(() => listUsers(), []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ANALYST' as Role });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) {
      setFormError('Name, email, and an 8+ character password are required.');
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      await createUser(form);
      toast.success('Team member added.');
      setIsModalOpen(false);
      setForm({ name: '', email: '', password: '', role: 'ANALYST' });
      users.refetch();
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : 'Failed to add team member.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (id: string, role: Role) => {
    try {
      await updateUser(id, { role });
      toast.success('Role updated.');
      users.refetch();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to update role.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      toast.success('Team member removed.');
      setDeleteTarget(null);
      users.refetch();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to remove team member.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Team</CardTitle>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {users.error ? (
          <div className="p-5">
            <ErrorState message={users.error.message} onRetry={users.refetch} />
          </div>
        ) : users.isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.data?.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} avatarUrl={member.avatarUrl} size="md" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{member.name}</p>
                    <p className="text-xs text-text-muted">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    options={ROLE_OPTIONS}
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as Role)}
                    className="h-9 w-32"
                    disabled={member.id === currentUser?.id}
                  />
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(member)}
                    disabled={member.id === currentUser?.id}
                    aria-label={`Remove ${member.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-hover hover:text-negative disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Team Member">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Temporary password"
            type="password"
            hint="At least 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          />
          {formError && <p className="text-sm text-negative">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} loading={isSaving}>
              Add Member
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove team member"
        description={`This will revoke ${deleteTarget?.name}'s access to this workspace.`}
        confirmLabel="Remove"
        isLoading={isDeleting}
      />
    </Card>
  );
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-text-secondary">Choose how HermesX looks on this device.</p>
        <div className="flex gap-3">
          {(['light', 'night'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTheme(mode)}
              className={cn(
                'flex-1 rounded-lg border p-4 text-left capitalize transition-colors',
                theme === mode ? 'border-primary bg-primary-soft text-primary' : 'border-border text-text-secondary hover:bg-hover'
              )}
            >
              <p className="text-sm font-medium">{mode} mode</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'workspace', label: 'Workspace' },
    ...(isAdmin ? [{ id: 'team' as Tab, label: 'Team' }] : []),
    { id: 'appearance', label: 'Appearance' },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.span
                layoutId="settings-tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'workspace' && <WorkspaceTab />}
          {activeTab === 'team' && isAdmin && <TeamTab />}
          {activeTab === 'appearance' && <AppearanceTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}