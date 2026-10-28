import type { TrailRepository } from '../../curriculum/domain/TrailRepository';
import type { CatalogTrail, TrailCatalog } from '../domain/TrailCatalog';

// Adapter from the curriculum's repository to the progress port. Only this infrastructure
// class knows about the curriculum; the progress domain and use cases see TrailCatalog.
// The outline already has the port's shape, so the typecheck flags any drift between them.
export class CurriculumTrailCatalog implements TrailCatalog {
  constructor(private readonly trails: TrailRepository) {}

  findFirst(): Promise<CatalogTrail | null> {
    return this.trails.findFirst();
  }

  findByLessonId(lessonId: string): Promise<CatalogTrail | null> {
    return this.trails.findByLessonId(lessonId);
  }

  count(): Promise<number> {
    return this.trails.count();
  }
}
