import { err, ok, type Result } from '../../../shared/domain/Result';
import {
  contentHasProgress,
  notFound,
  type DraftOutlineRepository,
  type OutlineLevel,
} from '../domain/DraftOutline';

export interface DeleteOutlineItemInput {
  level: OutlineLevel;
  id: string;
}

// Removes the item and everything below it. Content a learner already did stays, so their
// progress, XP and achievements are kept: the operator hides it instead.
export class DeleteOutlineItem {
  constructor(private readonly outline: DraftOutlineRepository) {}

  async execute({ level, id }: DeleteOutlineItemInput): Promise<Result<void>> {
    switch (await this.outline.delete(level, id)) {
      case 'deleted':
        return ok(undefined);
      case 'notFound':
        return err(notFound(level, id));
      case 'hasProgress':
        return err(contentHasProgress(`${level} ${id}`));
    }
  }
}
