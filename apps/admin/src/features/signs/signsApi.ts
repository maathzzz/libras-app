import {
  AdminSignsResponse,
  CreatedResponse,
  SIGN_IMAGE_MAX_BYTES,
  SignImageContentType,
  SignImageUploadResponse,
  type AdminSign,
  type SaveSignRequest,
} from '@libras/contracts';

import { apiRequest, NoContent } from '@/shared/api/client';

export async function getSigns(): Promise<AdminSign[]> {
  return (await apiRequest('/v1/admin/signs', AdminSignsResponse)).signs;
}

export async function createSign(sign: SaveSignRequest): Promise<string> {
  const { id } = await apiRequest('/v1/admin/signs', CreatedResponse, {
    method: 'POST',
    body: sign,
  });
  return id;
}

export async function updateSign(id: string, sign: SaveSignRequest): Promise<void> {
  await apiRequest(`/v1/admin/signs/${encodeURIComponent(id)}`, NoContent, {
    method: 'PUT',
    body: sign,
  });
}

export async function deleteSign(id: string): Promise<void> {
  await apiRequest(`/v1/admin/signs/${encodeURIComponent(id)}`, NoContent, { method: 'DELETE' });
}

// Why a picture cannot be sent, checked before uploading; null when it can. The bucket
// refuses the same files, this only answers sooner and in Portuguese.
export function imageProblem(file: File): string | null {
  if (!SignImageContentType.safeParse(file.type).success) {
    return `“${file.name}” não é WebP, PNG ou JPEG.`;
  }
  if (file.size > SIGN_IMAGE_MAX_BYTES) return `“${file.name}” tem mais de 1 MB.`;
  return null;
}

export class UploadError extends Error {}

// Asks the BFF where to send the picture, sends it straight to Supabase Storage and returns
// its public URL, to be saved in the sign.
export async function uploadSignImage(file: File): Promise<string> {
  const contentType = SignImageContentType.parse(file.type);
  const { uploadUrl, imageUrl } = await apiRequest(
    '/v1/admin/signs/uploads',
    SignImageUploadResponse,
    { method: 'POST', body: { contentType } },
  );

  let response: Response;
  try {
    response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'content-type': contentType },
      body: file,
    });
  } catch {
    throw new UploadError(`Não foi possível enviar “${file.name}”. Verifique a conexão.`);
  }
  if (!response.ok) throw new UploadError(`O armazenamento recusou “${file.name}”.`);
  return imageUrl;
}
