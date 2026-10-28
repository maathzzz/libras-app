import type { HomeResponse, TrailUnit } from '@libras/contracts';

import type { LocalDate } from '../../../shared/domain/LocalDate';
import type { LessonProgressRepository } from '../domain/LessonProgressRepository';
import { LessonUnlocking } from '../domain/LessonUnlocking';
import { Streak } from '../domain/Streak';
import { lessonIdsOf, type CatalogTrail, type TrailCatalog } from '../domain/TrailCatalog';
import type { UserStatsRepository } from '../domain/UserStatsRepository';

// userId comes from the token; today is the device's date from the X-Local-Date header.
export interface GetHomeInput {
  userId: string;
  today: LocalDate;
}

export class GetHome {
  constructor(
    private readonly trails: TrailCatalog,
    private readonly progress: LessonProgressRepository,
    private readonly stats: UserStatsRepository,
  ) {}

  async execute({ userId, today }: GetHomeInput): Promise<HomeResponse> {
    const [trail, totalTrails, completed, stats] = await Promise.all([
      this.trails.findFirst(),
      this.trails.count(),
      this.progress.findCompletedLessonIds(userId),
      this.stats.findByUserId(userId),
    ]);
    // The seed always creates a trail, so a missing one is a broken environment.
    if (!trail) throw new Error('No trail to show on the home');

    // A learner without stats has never completed a lesson: no streak and no XP.
    const streak = stats?.streak ?? Streak.empty();

    return {
      trail: {
        id: trail.id,
        title: trail.title,
        position: trail.position,
        totalTrails,
        units: unitsWithStatus(trail, completed),
      },
      streak: streak.summaryAt(today),
      totalXp: stats?.totalXp ?? 0,
    };
  }
}

// Units without lessons are still being planned and have nothing to open, so they are left
// out of the home.
function unitsWithStatus(trail: CatalogTrail, completed: ReadonlySet<string>): TrailUnit[] {
  const statuses = LessonUnlocking.statusesOf(lessonIdsOf(trail), completed);

  return trail.units
    .filter((unit) => unit.lessons.length > 0)
    .map((unit) => ({
      id: unit.id,
      title: unit.title,
      lessons: unit.lessons.map((lesson) => ({
        ...lesson,
        // Every lesson of the trail has a status.
        status: statuses.get(lesson.id) ?? 'locked',
      })),
    }));
}
