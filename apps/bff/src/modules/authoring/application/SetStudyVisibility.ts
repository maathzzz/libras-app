import { err, ok, type Result } from '../../../shared/domain/Result';
import { studyNotFound, type DraftStudyRepository } from '../domain/DraftStudy';

// Shows a study in the "Estudar" tab, or hides it.
export class SetStudyVisibility {
  constructor(private readonly studies: DraftStudyRepository) {}

  async execute({ id, visible }: { id: string; visible: boolean }): Promise<Result<void>> {
    const changed = await this.studies.setVisible(id, visible);
    return changed ? ok(undefined) : err(studyNotFound(id));
  }
}
