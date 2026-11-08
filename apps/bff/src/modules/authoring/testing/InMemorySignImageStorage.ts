import type { SignImageStorage, SignImageUpload } from '../domain/SignImageStorage';

// For tests: records the uploads it authorized.
export class InMemorySignImageStorage implements SignImageStorage {
  readonly paths: string[] = [];

  async createUpload(path: string): Promise<SignImageUpload> {
    this.paths.push(path);
    return {
      uploadUrl: `https://storage.test/upload/${path}?token=t`,
      imageUrl: `https://storage.test/public/${path}`,
    };
  }
}
