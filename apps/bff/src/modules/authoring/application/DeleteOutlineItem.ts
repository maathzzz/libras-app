import { err, ok, type Result } from '../../../shared/domain/Result';
import { notFound, type DraftOutlineRepository, type OutlineLevel } from '../domain/DraftOutline';

export interface DeleteOutlineItemInput {
  level: OutlineLevel;
  id: string;
}

// Removes the item and everything below it from the draft only. What learners already did
// is decided when publishing: published content with progress is archived, never erased.
export class DeleteOutlineItem {
  constructor(private readonly outline: DraftOutlineRepository) {}

  async execute({ level, id }: DeleteOutlineItemInput): Promise<Result<void>> {
    const deleted = await this.outline.delete(level, id);
    return deleted ? ok(undefined) : err(notFound(level, id));
  }
}
