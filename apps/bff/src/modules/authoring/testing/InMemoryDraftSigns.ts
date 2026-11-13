import type { AdminSign } from '@libras/contracts';

import type {
  DeleteSignOutcome,
  DraftSign,
  DraftSignRepository,
} from '../domain/DraftSignRepository';

// For tests. `exerciseCount` and `studyCount` stand for the draft content that shows each
// sign.
export class InMemoryDraftSigns implements DraftSignRepository {
  private readonly byId = new Map<string, AdminSign>();

  constructor(signs: readonly AdminSign[] = []) {
    for (const sign of signs) this.byId.set(sign.id, structuredClone(sign));
  }

  async list(): Promise<AdminSign[]> {
    return [...this.byId.values()]
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
      .map((sign) => structuredClone(sign));
  }

  async findByIds(ids: readonly string[]): Promise<DraftSign[]> {
    return ids.flatMap((id) => {
      const sign = this.byId.get(id);
      if (!sign) return [];
      const { id: signId, label, imageUrls, alt, description } = structuredClone(sign);
      return [{ id: signId, label, imageUrls, alt, description }];
    });
  }

  async create(sign: DraftSign): Promise<void> {
    this.byId.set(sign.id, { ...structuredClone(sign), exerciseCount: 0, studyCount: 0 });
  }

  async update(sign: DraftSign): Promise<boolean> {
    const current = this.byId.get(sign.id);
    if (!current) return false;
    this.byId.set(sign.id, {
      ...structuredClone(sign),
      exerciseCount: current.exerciseCount,
      studyCount: current.studyCount,
    });
    return true;
  }

  async delete(id: string): Promise<DeleteSignOutcome> {
    const sign = this.byId.get(id);
    if (!sign) return 'notFound';
    if (sign.exerciseCount > 0 || sign.studyCount > 0) return 'inUse';
    this.byId.delete(id);
    return 'deleted';
  }
}
