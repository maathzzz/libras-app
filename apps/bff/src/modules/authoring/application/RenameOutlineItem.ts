import { err, ok, type Result } from '../../../shared/domain/Result';
import { notFound, type DraftOutlineRepository, type OutlineLevel } from '../domain/DraftOutline';

export interface RenameOutlineItemInput {
  level: OutlineLevel;
  id: string;
  title: string;
}

export class RenameOutlineItem {
  constructor(private readonly outline: DraftOutlineRepository) {}

  async execute({ level, id, title }: RenameOutlineItemInput): Promise<Result<void>> {
    const renamed = await this.outline.rename(level, id, title);
    return renamed ? ok(undefined) : err(notFound(level, id));
  }
}
