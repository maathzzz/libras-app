// Port to the curriculum: the trail's units and lessons in display order, which is the order
// lessons unlock in. Progress depends only on this shape, never on the curriculum module.
export interface CatalogTrail {
  id: string;
  title: string;
  position: number;
  units: CatalogUnit[];
}

// A unit without lessons yet keeps an empty list.
export interface CatalogUnit {
  id: string;
  title: string;
  lessons: { id: string; title: string }[];
}

export interface TrailCatalog {
  // The trail with the lowest position, the one shown on the home. Null when there is none.
  findFirst(): Promise<CatalogTrail | null>;
  // The trail that holds the lesson. Null for an unknown lesson.
  findByLessonId(lessonId: string): Promise<CatalogTrail | null>;
  count(): Promise<number>;
}

export function lessonIdsOf(trail: CatalogTrail): string[] {
  return trail.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
}
