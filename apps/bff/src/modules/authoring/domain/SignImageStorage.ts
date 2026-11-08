export interface SignImageUpload {
  // Single-use URL the CMS sends the file to with PUT.
  uploadUrl: string;
  // Public URL the file will have, saved in the sign.
  imageUrl: string;
}

// Where sign pictures live (the public `signs` bucket of Supabase Storage). The file goes
// from the CMS straight to the storage; the BFF only authorizes the upload. The bucket itself
// refuses files over 1 MB or of another type, since the BFF never sees the file.
export interface SignImageStorage {
  createUpload(path: string): Promise<SignImageUpload>;
}
