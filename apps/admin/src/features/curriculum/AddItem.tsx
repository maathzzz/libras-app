'use client';

import { useState } from 'react';

import { Button } from '@/shared/ui';

import { TitleForm } from './TitleForm';

// A "+ label" button that opens an inline form to name the new item.
export function AddItem({
  label,
  onAdd,
}: {
  label: string;
  onAdd: (title: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);

  if (!adding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="justify-self-start"
        onClick={() => setAdding(true)}
      >
        + {label}
      </Button>
    );
  }
  return (
    <TitleForm
      label={label}
      submitLabel="Adicionar"
      onSubmit={async (title) => {
        await onAdd(title);
        setAdding(false);
      }}
      onCancel={() => setAdding(false)}
    />
  );
}
