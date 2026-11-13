import { err, ok, type Result } from '../../../shared/domain/Result';
import { notFound, parentLevel, type CmsOutlineRepository } from '../domain/CmsOutline';
import { invalidOrder, isSameList } from '../domain/listOrder';

export type ReorderOutlineItemsInput =
  | { level: 'trail'; ids: readonly string[] }
  | { level: 'unit' | 'lesson'; parentId: string; ids: readonly string[] };

export class ReorderOutlineItems {
  constructor(private readonly outline: CmsOutlineRepository) {}

  async execute(input: ReorderOutlineItemsInput): Promise<Result<void>> {
    const parentId = input.level === 'trail' ? null : input.parentId;
    const current = await this.outline.listIds(input.level, parentId);
    // Trails always have a list, so only a missing parent gets here.
    if (!current) {
      return err(notFound(parentLevel[input.level] ?? input.level, parentId ?? ''));
    }

    if (!isSameList(current, input.ids)) return err(invalidOrder());

    await this.outline.reorder(input.level, parentId, input.ids);
    return ok(undefined);
  }
}
