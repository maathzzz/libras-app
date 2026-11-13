import type { IdGenerator } from '../../../shared/application/IdGenerator';
import type { DraftStudyRepository } from '../domain/DraftStudy';

// Adds a study group at the end of the "Estudar" tab.
export class CreateStudyGroup {
  constructor(
    private readonly studies: DraftStudyRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute({ title }: { title: string }): Promise<{ id: string }> {
    const id = this.ids.next('study-group');
    await this.studies.createGroup({ id, title });
    return { id };
  }
}
