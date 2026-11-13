import { err, ok, type Result } from '../../../shared/domain/Result';
import { notFound, type DraftOutlineRepository, type OutlineLevel } from '../domain/DraftOutline';

export interface SetOutlineItemVisibilityInput {
  level: OutlineLevel;
  id: string;
  visible: boolean;
}

// Shows a trail, unit or lesson to learners, or hides it. Hiding is also how content that
// learners already did is archived.
export class SetOutlineItemVisibility {
  constructor(private readonly outline: DraftOutlineRepository) {}

  async execute({ level, id, visible }: SetOutlineItemVisibilityInput): Promise<Result<void>> {
    const changed = await this.outline.setVisible(level, id, visible);
    return changed ? ok(undefined) : err(notFound(level, id));
  }
}
