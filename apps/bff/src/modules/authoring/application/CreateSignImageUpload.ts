import type { SignImageContentType } from '@libras/contracts';

import type { IdGenerator } from '../../../shared/application/IdGenerator';
import type { SignImageStorage, SignImageUpload } from '../domain/SignImageStorage';

const extensions: Record<SignImageContentType, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

export interface CreateSignImageUploadInput {
  contentType: SignImageContentType;
}

// Every upload gets a new path under `cms/`, so a published sign never has its file
// replaced: a sign keeps its old picture until the operator saves the new one.
export class CreateSignImageUpload {
  constructor(
    private readonly storage: SignImageStorage,
    private readonly ids: IdGenerator,
  ) {}

  async execute({ contentType }: CreateSignImageUploadInput): Promise<SignImageUpload> {
    const path = `cms/${this.ids.next('image')}.${extensions[contentType]}`;
    return this.storage.createUpload(path);
  }
}
