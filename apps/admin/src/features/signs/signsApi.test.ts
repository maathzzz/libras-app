import type * as ClientModule from '@/shared/api/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from '@/shared/api/client';

import { imageProblem, UploadError, uploadSignImage } from './signsApi';

vi.mock('@/shared/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof ClientModule>()),
  apiRequest: vi.fn(),
}));

const request = vi.mocked(apiRequest);
const fetchMock = vi.fn();

const file = (type: string, size = 10) => new File([new Uint8Array(size)], 'mao.webp', { type });

beforeEach(() => {
  request.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  request.mockResolvedValue({
    uploadUrl: 'https://storage.test/upload/cms/image-1.webp?token=t',
    imageUrl: 'https://storage.test/public/cms/image-1.webp',
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('imageProblem', () => {
  it('accepts WebP, PNG and JPEG up to 1 MB', () => {
    expect(imageProblem(file('image/webp'))).toBeNull();
    expect(imageProblem(file('image/jpeg', 1024 * 1024))).toBeNull();
  });

  it('refuses other types and bigger files', () => {
    expect(imageProblem(file('image/gif'))).toMatch(/não é WebP/);
    expect(imageProblem(file('image/png', 1024 * 1024 + 1))).toMatch(/mais de 1 MB/);
  });
});

describe('uploadSignImage', () => {
  it('sends the file to the signed URL and returns the public URL', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const picture = file('image/webp');

    await expect(uploadSignImage(picture)).resolves.toBe(
      'https://storage.test/public/cms/image-1.webp',
    );

    expect(request.mock.calls[0]?.[2]).toEqual({
      method: 'POST',
      body: { contentType: 'image/webp' },
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://storage.test/upload/cms/image-1.webp?token=t');
    expect(init).toMatchObject({ method: 'PUT', body: picture });
  });

  it('reports a file the storage refuses', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400 });

    await expect(uploadSignImage(file('image/webp'))).rejects.toBeInstanceOf(UploadError);
  });
});
