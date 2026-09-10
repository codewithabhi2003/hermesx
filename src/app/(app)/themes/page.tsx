'use client';

import { useState } from 'react';
import { Tags, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { listThemes, createTheme, updateTheme, deleteTheme } from '@/services/api/themes.api';
import { ApiClientError } from '@/services/api/client';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import type { ThemeDto } from '@/types';

const DEFAULT_COLOR = '#6366F1';

interface ThemeFormState {
  name: string;
  description: string;
  color: string;
}

const EMPTY_FORM: ThemeFormState = { name: '', description: '', color: DEFAULT_COLOR };

export default function ThemesPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const canManage = hasRole('ADMIN', 'ANALYST');
  const canDelete = hasRole('ADMIN');

  const themes = useAsync(() => listThemes(), []);

  const [editingTheme, setEditingTheme] = useState<ThemeDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<ThemeFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ThemeDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setEditingTheme(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (theme: ThemeDto) => {
    setEditingTheme(theme);
    setForm({ name: theme.name, description: theme.description ?? '', color: theme.color });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Theme name is required.');
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      if (editingTheme) {
        await updateTheme(editingTheme.id, form);
        toast.success('Theme updated.');
      } else {
        await createTheme(form);
        toast.success('Theme created.');
      }
      setIsFormOpen(false);
      themes.refetch();
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : 'Failed to save theme.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTheme(deleteTarget.id);
      toast.success('Theme deleted.');
      setDeleteTarget(null);
      themes.refetch();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to delete theme.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Themes</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage and analyze feedback themes.</p>
        </div>
        {canManage && (
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Create Theme
          </Button>
        )}
      </div>

      {themes.error ? (
        <ErrorState message={themes.error.message} onRetry={themes.refetch} />
      ) : themes.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : themes.data && themes.data.length > 0 ? (
        <div className="space-y-3">
          {themes.data.map((theme) => (
            <Card key={theme.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${theme.color}1A`, color: theme.color }}
                >
                  <Tags className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-text-primary">{theme.name}</p>
                  <p className="text-xs text-text-muted">{theme.feedbackCount} feedback items</p>
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(theme)}
                    aria-label={`Edit ${theme.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-hover hover:text-text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(theme)}
                      aria-label={`Delete ${theme.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-hover hover:text-negative"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Tags}
          title="No themes yet"
          description="Themes are created automatically as feedback is classified, or you can add one manually."
          action={
            canManage && (
              <Button variant="primary" size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Create Theme
              </Button>
            )
          }
        />
      )}

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingTheme ? 'Edit Theme' : 'Create Theme'}>
        <div className="space-y-4">
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Textarea
            label="Description (optional)"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Color</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-10 w-20 cursor-pointer rounded-lg border border-border bg-input"
            />
          </div>
          {formError && <p className="text-sm text-negative">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={isSaving}>
              {editingTheme ? 'Save changes' : 'Create Theme'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete theme"
        description={`This will remove "${deleteTarget?.name}" from all feedback it's tagged on. This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
