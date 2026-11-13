import type { AdminSign } from '@libras/contracts';

export interface CmsSign {
  id: string;
  label: string;
  imageUrls: string[];
  alt: string;
  description: string | null;
}

export type DeleteSignOutcome = 'deleted' | 'notFound' | 'inUse';

export interface CmsSignRepository {
  // Every sign, by label, with how many exercises and studies show it.
  list(): Promise<AdminSign[]>;
  // The signs among `ids` that exist, in any order.
  findByIds(ids: readonly string[]): Promise<CmsSign[]>;
  create(sign: CmsSign): Promise<void>;
  // Replaces every field and brings the copy of the sign in every exercise and study
  // that shows it up to date, in one transaction. False when the sign does not exist.
  update(sign: CmsSign): Promise<boolean>;
  // A sign shown by an exercise or a study stays: 'inUse'.
  delete(id: string): Promise<DeleteSignOutcome>;
}
