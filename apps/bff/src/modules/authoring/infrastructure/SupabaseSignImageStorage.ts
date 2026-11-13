import { z } from 'zod';

import type { SignImageStorage, SignImageUpload } from '../domain/SignImageStorage';

const BUCKET = 'signs';

// `url` is relative to /storage/v1 and already carries the upload token.
const SignedUploadResponse = z.object({ url: z.string().startsWith('/') });

// Calls the Storage API directly, like SupabaseAuthAdmin does with Auth, instead of pulling
// in supabase-js for one request.
export class SupabaseSignImageStorage implements SignImageStorage {
  constructor(
    private readonly supabaseUrl: string,
    // Creating a signed upload URL needs the secret key, which never leaves the BFF.
    private readonly secretKey: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async createUpload(path: string): Promise<SignImageUpload> {
    const storage = `${this.supabaseUrl}/storage/v1`;
    const response = await this.fetchFn(`${storage}/object/upload/sign/${BUCKET}/${path}`, {
      method: 'POST',
      headers: { apikey: this.secretKey, Authorization: `Bearer ${this.secretKey}` },
    });
    if (!response.ok) {
      throw new Error(
        `Supabase Storage refused an upload URL for ${path}: HTTP ${response.status}`,
      );
    }

    const { url } = SignedUploadResponse.parse(await response.json());
    return {
      uploadUrl: `${storage}${url}`,
      imageUrl: `${storage}/object/public/${BUCKET}/${path}`,
    };
  }
}
