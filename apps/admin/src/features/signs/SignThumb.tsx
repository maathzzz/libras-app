'use client';

import Image from 'next/image';
import { useState } from 'react';

const sizes = { sm: 'size-16', md: 'size-24' } as const;

// One picture of a sign. Seeded signs without a picture point to `.invalid` addresses, so a
// picture that fails to load shows a placeholder, as the app does.
export function SignThumb({
  url,
  alt,
  size = 'md',
}: {
  url: string;
  alt: string;
  size?: keyof typeof sizes;
}) {
  const [failed, setFailed] = useState(false);
  const box = `${sizes[size]} shrink-0 rounded-sm bg-surface-subtle`;

  if (failed) {
    return (
      <div
        className={`${box} grid place-items-center p-1 text-center text-[11px] text-text-subtle`}
      >
        sem imagem
      </div>
    );
  }

  // Not optimized by Next: the pictures are already small WebP files on Supabase Storage.
  return (
    <Image
      src={url}
      alt={alt}
      width={96}
      height={96}
      unoptimized
      className={`${box} object-contain`}
      onError={() => setFailed(true)}
    />
  );
}
