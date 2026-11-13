// Ids for new content, as `<prefix>-<random>` (e.g. `lesson-k3f9x2qa`). Ids are permanent,
// so they are never derived from a title that may change. Injected, like the Clock, so tests
// get predictable ids.
export interface IdGenerator {
  next(prefix: string): string;
}
