'use client';

import { ContentTitle } from '@libras/contracts';
import { useState, type FormEvent } from 'react';

import { Button, inputClassName } from '@/shared/ui';

interface TitleFormProps {
  label: string;
  initialTitle?: string;
  submitLabel: string;
  onSubmit: (title: string) => Promise<void>;
  onCancel: () => void;
}

// Inline form to name a new trail, module or lesson, or to rename one.
export function TitleForm({
  label,
  initialTitle = '',
  submitLabel,
  onSubmit,
  onCancel,
}: TitleFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const valid = ContentTitle.safeParse(title).success;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      await onSubmit(title.trim());
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-wrap items-center gap-2" onSubmit={submit}>
      <input
        aria-label={label}
        className={`${inputClassName} max-w-md flex-1`}
        value={title}
        maxLength={80}
        autoFocus
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel();
        }}
      />
      <Button variant="primary" size="sm" type="submit" disabled={!valid || saving}>
        {saving ? 'Salvando…' : submitLabel}
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
        Cancelar
      </Button>
    </form>
  );
}
