import type { AdminLesson, AdminTrail, AdminUnit } from '@libras/contracts';

import type {
  DeleteOutlineOutcome,
  CmsOutlineRepository,
  NewOutlineItem,
  OutlineLevel,
} from '../domain/CmsOutline';

type Item = AdminTrail | AdminUnit | AdminLesson;

// For tests: the outline as nested lists, in the order they are given. `lessonsWithProgress`
// stands for the lessons some learner already did.
export class InMemoryCmsOutline implements CmsOutlineRepository {
  private readonly trails: AdminTrail[];

  constructor(
    trails: readonly AdminTrail[] = [],
    private readonly lessonsWithProgress: ReadonlySet<string> = new Set(),
  ) {
    this.trails = structuredClone([...trails]);
  }

  async listTrails(): Promise<AdminTrail[]> {
    return structuredClone(this.trails);
  }

  async listIds(level: OutlineLevel, parentId: string | null): Promise<string[] | null> {
    return this.listOf(level, parentId)?.map((item) => item.id) ?? null;
  }

  async create(level: OutlineLevel, { id, parentId, title }: NewOutlineItem): Promise<boolean> {
    if (level === 'trail') {
      this.trails.push({ id, title, visible: false, units: [] });
      return true;
    }
    if (level === 'unit') {
      const trail = this.trails.find((candidate) => candidate.id === parentId);
      trail?.units.push({ id, title, visible: false, lessons: [] });
      return trail !== undefined;
    }
    const unit = this.units().find((candidate) => candidate.id === parentId);
    unit?.lessons.push({ id, title, visible: false, exerciseCount: 0 });
    return unit !== undefined;
  }

  async rename(level: OutlineLevel, id: string, title: string): Promise<boolean> {
    const item = this.allOf(level).find((candidate) => candidate.id === id);
    if (item) item.title = title;
    return item !== undefined;
  }

  async setVisible(level: OutlineLevel, id: string, visible: boolean): Promise<boolean> {
    const item = this.allOf(level).find((candidate) => candidate.id === id);
    if (item) item.visible = visible;
    return item !== undefined;
  }

  async delete(level: OutlineLevel, id: string): Promise<DeleteOutlineOutcome> {
    const item = this.allOf(level).find((candidate) => candidate.id === id);
    if (!item) return 'notFound';
    if (this.lessonIdsOf(item).some((lessonId) => this.lessonsWithProgress.has(lessonId))) {
      return 'hasProgress';
    }
    this.remove(level, id);
    return 'deleted';
  }

  private lessonIdsOf(item: Item): string[] {
    if ('units' in item) return item.units.flatMap((unit) => unit.lessons.map(({ id }) => id));
    if ('lessons' in item) return item.lessons.map(({ id }) => id);
    return [item.id];
  }

  private remove(level: OutlineLevel, id: string): boolean {
    const lists: Item[][] =
      level === 'trail'
        ? [this.trails]
        : level === 'unit'
          ? this.trails.map((trail) => trail.units)
          : this.units().map((unit) => unit.lessons);
    for (const list of lists) {
      const index = list.findIndex((item) => item.id === id);
      if (index >= 0) {
        list.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  async reorder(level: OutlineLevel, parentId: string | null, ids: readonly string[]) {
    const list = this.listOf(level, parentId);
    if (!list) return;
    const ordered = ids.flatMap((id) => list.filter((item) => item.id === id));
    list.splice(0, list.length, ...ordered);
  }

  private units(): AdminUnit[] {
    return this.trails.flatMap((trail) => trail.units);
  }

  private allOf(level: OutlineLevel): Item[] {
    if (level === 'trail') return this.trails;
    if (level === 'unit') return this.units();
    return this.units().flatMap((unit) => unit.lessons);
  }

  private listOf(level: OutlineLevel, parentId: string | null): Item[] | null {
    if (level === 'trail') return this.trails;
    if (level === 'unit') {
      return this.trails.find((trail) => trail.id === parentId)?.units ?? null;
    }
    return this.units().find((unit) => unit.id === parentId)?.lessons ?? null;
  }
}
