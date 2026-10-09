import { Image } from 'expo-image';

/**
 * Warms the image cache, giving up after `timeoutMs`. Never rejects: a slow network or a
 * broken url only means that image loads (or shows its placeholder) when it is displayed.
 */
export async function prefetchImages(urls: readonly string[], timeoutMs: number): Promise<void> {
  const unique = [...new Set(urls)];
  if (unique.length === 0) return;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });
  const prefetch = Image.prefetch(unique, 'memory-disk').then(
    () => undefined,
    () => undefined,
  );

  await Promise.race([prefetch, timeout]);
  clearTimeout(timer);
}
