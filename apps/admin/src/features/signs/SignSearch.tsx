'use client';

import type { AdminSign } from '@libras/contracts';
import { useState } from 'react';

import { normalized } from '@/shared/search';
import { Button, hintClassName, inputClassName, labelClassName } from '@/shared/ui';

// Enough to find a sign without turning the form into the whole sign list.
const MAX_RESULTS = 12;

interface SignSearchProps {
  signs: readonly AdminSign[];
  label: string;
  // Signs already chosen, left out of the results.
  excludeIds?: readonly string[];
  onPick: (sign: AdminSign) => void;
}

// Finds a draft sign by name and picks it with one click.
export function SignSearch({ signs, label, excludeIds = [], onPick }: SignSearchProps) {
  const [query, setQuery] = useState('');

  const wanted = normalized(query.trim());
  const results = wanted
    ? signs
        .filter((sign) => !excludeIds.includes(sign.id) && normalized(sign.label).includes(wanted))
        .slice(0, MAX_RESULTS)
    : [];

  return (
    <div className="grid gap-2">
      <label className={labelClassName}>
        {label}
        <input
          type="search"
          className={`${inputClassName} max-w-sm`}
          placeholder="Buscar pelo nome"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {wanted && results.length === 0 && (
        <p className={hintClassName}>Nenhum sinal com esse nome.</p>
      )}
      {results.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Sinais encontrados">
          {results.map((sign) => (
            <li key={sign.id}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onPick(sign);
                  setQuery('');
                }}
              >
                + {sign.label}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
