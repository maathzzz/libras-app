import { lessonIdsOf, type CatalogTrail, type TrailCatalog } from '../domain/TrailCatalog';

// For tests.
export class InMemoryTrailCatalog implements TrailCatalog {
  constructor(private readonly trails: readonly CatalogTrail[]) {}

  async findFirst(): Promise<CatalogTrail | null> {
    const [first] = [...this.trails].sort((a, b) => a.position - b.position);
    return first ?? null;
  }

  async findByLessonId(lessonId: string): Promise<CatalogTrail | null> {
    return this.trails.find((trail) => lessonIdsOf(trail).includes(lessonId)) ?? null;
  }

  async count(): Promise<number> {
    return this.trails.length;
  }
}
