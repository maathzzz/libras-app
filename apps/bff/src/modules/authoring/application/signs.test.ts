import type { AdminSign } from '@libras/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { SequentialIdGenerator } from '../../../shared/application/SequentialIdGenerator';
import { InMemoryDraftSigns } from '../testing/InMemoryDraftSigns';
import { InMemorySignImageStorage } from '../testing/InMemorySignImageStorage';
import { CreateSign } from './CreateSign';
import { CreateSignImageUpload } from './CreateSignImageUpload';
import { DeleteSign } from './DeleteSign';
import { GetDraftSigns } from './GetDraftSigns';
import { UpdateSign } from './UpdateSign';

const letterA: AdminSign = {
  id: 'letter-a',
  label: 'A',
  imageUrls: ['https://x.test/a.webp'],
  alt: 'Mão fechada',
  description: null,
  exerciseCount: 3,
};

const unused: AdminSign = { ...letterA, id: 'sign-old', label: 'Velho', exerciseCount: 0 };

let signs: InMemoryDraftSigns;

beforeEach(() => {
  signs = new InMemoryDraftSigns([letterA, unused]);
});

describe('sign use cases', () => {
  it('creates a sign with a new id', async () => {
    const { id } = await new CreateSign(signs, new SequentialIdGenerator()).execute({
      label: 'Oi',
      imageUrls: ['https://x.test/oi-1.webp', 'https://x.test/oi-2.webp'],
      alt: 'Mão aberta acenando',
      description: 'Mão aberta, balança de um lado para o outro.',
    });

    expect(id).toBe('sign-1');
    const { signs: listed } = await new GetDraftSigns(signs).execute();
    expect(listed.find((sign) => sign.id === id)).toMatchObject({ label: 'Oi', exerciseCount: 0 });
  });

  it('replaces every field of a sign', async () => {
    const result = await new UpdateSign(signs).execute({
      id: 'letter-a',
      label: 'A',
      imageUrls: ['https://x.test/a-v2.webp'],
      alt: 'Mão fechada, polegar ao lado',
      description: 'Mão fechada com o polegar ao lado do indicador.',
    });

    expect(result.ok).toBe(true);
    const { signs: listed } = await new GetDraftSigns(signs).execute();
    expect(listed.find((sign) => sign.id === 'letter-a')?.imageUrls).toEqual([
      'https://x.test/a-v2.webp',
    ]);
  });

  it('reports an unknown sign', async () => {
    const result = await new UpdateSign(signs).execute({ ...letterA, id: 'nope' });

    expect(result.ok || result.error.code).toBe('SIGN_NOT_FOUND');
  });

  it('deletes a sign no exercise shows and keeps one in use', async () => {
    const remove = new DeleteSign(signs);

    expect((await remove.execute({ id: 'sign-old' })).ok).toBe(true);
    const inUse = await remove.execute({ id: 'letter-a' });
    const missing = await remove.execute({ id: 'nope' });

    expect(inUse.ok || inUse.error.code).toBe('SIGN_IN_USE');
    expect(missing.ok || missing.error.code).toBe('SIGN_NOT_FOUND');
  });

  it('authorizes each upload on a new path with the extension of its type', async () => {
    const storage = new InMemorySignImageStorage();
    const upload = new CreateSignImageUpload(storage, new SequentialIdGenerator());

    await upload.execute({ contentType: 'image/webp' });
    const jpeg = await upload.execute({ contentType: 'image/jpeg' });

    expect(storage.paths).toEqual(['cms/image-1.webp', 'cms/image-2.jpg']);
    expect(jpeg.imageUrl).toBe('https://storage.test/public/cms/image-2.jpg');
  });
});
