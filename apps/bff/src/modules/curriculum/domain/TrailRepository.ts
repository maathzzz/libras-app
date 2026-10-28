// A trail (a course in the database) with its units and lessons in display order. It has
// no lesson status: unlocking depends on the learner's progress, which lives elsewhere.
export interface TrailOutline {
  id: string;
  title: string;
  position: number;
  units: TrailOutlineUnit[];
}

// A unit without lessons yet keeps an empty list; whoever builds the screen decides
// whether to show it.
export interface TrailOutlineUnit {
  id: string;
  title: string;
  lessons: { id: string; title: string }[];
}

export interface TrailRepository {
  findById(trailId: string): Promise<TrailOutline | null>;
  // The trail with the lowest position. Null when there is none.
  findFirst(): Promise<TrailOutline | null>;
  // The trail that holds the lesson. Null for an unknown lesson.
  findByLessonId(lessonId: string): Promise<TrailOutline | null>;
  count(): Promise<number>;
}
