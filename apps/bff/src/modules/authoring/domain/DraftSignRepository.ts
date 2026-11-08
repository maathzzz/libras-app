import type { AdminSign } from '@libras/contracts';

export interface DraftSign {
  id: string;
  label: string;
  imageUrls: string[];
  alt: string;
  description: string | null;
}

export type DeleteSignOutcome = 'deleted' | 'notFound' | 'inUse';

export interface DraftSignRepository {
  // Every draft sign, by label, with how many draft exercises show it.
  list(): Promise<AdminSign[]>;
  create(sign: DraftSign): Promise<void>;
  // Replaces every field. False when the sign does not exist.
  update(sign: DraftSign): Promise<boolean>;
  // A sign shown by a draft exercise stays: 'inUse'.
  delete(id: string): Promise<DeleteSignOutcome>;
}
