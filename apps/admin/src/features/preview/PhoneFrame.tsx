import type { ReactNode } from 'react';

// A phone-sized screen with the app's colors. It is an approximation of the app, not the
// app itself: sizes and fonts differ a little.
export function PhoneFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="grid w-[360px] max-w-full gap-2 justify-self-center">
      <div className="h-[640px] overflow-y-auto rounded-[32px] border-8 border-text bg-background shadow-[0_8px_24px_rgb(16_36_46/0.18)]">
        <div className="grid gap-5 p-5">{children}</div>
      </div>
      <figcaption className="text-center text-[12px] text-text-muted">
        {title} · prévia aproximada do app
      </figcaption>
    </figure>
  );
}
