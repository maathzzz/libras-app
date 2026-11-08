import type { IdGenerator } from '../../../shared/application/IdGenerator';
import { err, ok, type Result } from '../../../shared/domain/Result';
import { notFound, parentLevel, type DraftOutlineRepository } from '../domain/DraftOutline';

export type CreateOutlineItemInput =
  { level: 'trail'; title: string } | { level: 'unit' | 'lesson'; parentId: string; title: string };

// Creates a trail, a unit in a trail or a lesson in a unit, at the end of its list.
export class CreateOutlineItem {
  constructor(
    private readonly outline: DraftOutlineRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateOutlineItemInput): Promise<Result<{ id: string }>> {
    const id = this.ids.next(input.level);

    if (input.level === 'trail') {
      await this.outline.create('trail', { id, parentId: null, title: input.title });
      return ok({ id });
    }

    const { level, parentId, title } = input;
    const created = await this.outline.create(level, { id, parentId, title });
    return created ? ok({ id }) : err(notFound(parentLevel[level], parentId));
  }
}
