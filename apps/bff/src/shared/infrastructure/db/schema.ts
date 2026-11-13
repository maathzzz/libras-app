import type { CompleteLessonResponse, Exercise, StudyPage } from '@libras/contracts';
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { authUsers } from 'drizzle-orm/supabase';

// Mirrors supabase/migrations, which are the source of truth: this file only types the
// queries and is never used to generate migrations. Change both together.
export const app = pgSchema('app');

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

// Content

export const courses = app.table(
  'courses',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    position: integer('position').notNull(),
    // Shown to learners. Content created in the CMS starts hidden.
    visible: boolean('visible').notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [check('courses_position_check', sql`${table.position} > 0`)],
);

export const units = app.table(
  'units',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    position: integer('position').notNull(),
    // Shown to learners. Content created in the CMS starts hidden.
    visible: boolean('visible').notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [
    check('units_position_check', sql`${table.position} > 0`),
    index('units_course_id_position_idx').on(table.courseId, table.position),
  ],
);

export const lessons = app.table(
  'lessons',
  {
    id: text('id').primaryKey(),
    unitId: text('unit_id')
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    position: integer('position').notNull(),
    // Shown to learners. Content created in the CMS starts hidden.
    visible: boolean('visible').notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [
    check('lessons_position_check', sql`${table.position} > 0`),
    index('lessons_unit_id_position_idx').on(table.unitId, table.position),
  ],
);

export const exercises = app.table(
  'exercises',
  {
    id: text('id').primaryKey(),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    type: text('type').$type<Exercise['type']>().notNull(),
    position: integer('position').notNull(),
    // Validate with the Exercise schema from @libras/contracts before writing.
    payload: jsonb('payload').$type<Exercise>().notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    check('exercises_position_check', sql`${table.position} > 0`),
    check(
      'exercises_payload_matches_columns',
      sql`${table.payload} ->> 'id' = ${table.id} and ${table.payload} ->> 'type' = ${table.type}`,
    ),
    index('exercises_lesson_id_position_idx').on(table.lessonId, table.position),
  ],
);

export const signs = app.table(
  'signs',
  {
    id: text('id').primaryKey(),
    label: text('label').notNull(),
    imagePaths: text('image_paths').array().notNull(),
    alt: text('alt').notNull(),
    // Visible text on how to perform the sign; null while not written.
    description: text('description'),
    createdAt: createdAt(),
  },
  (table) => [
    check('signs_image_paths_check', sql`cardinality(${table.imagePaths}) > 0`),
    check(
      'signs_description_check',
      sql`${table.description} is null or char_length(${table.description}) between 1 and 500`,
    ),
  ],
);

export const exerciseSigns = app.table(
  'exercise_signs',
  {
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'cascade' }),
    signId: text('sign_id')
      .notNull()
      .references(() => signs.id, { onDelete: 'restrict' }),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.exerciseId, table.signId] }),
    index('exercise_signs_sign_id_idx').on(table.signId),
  ],
);

// A section of the "Estudar" tab. Unrelated to the trails.
export const studyGroups = app.table(
  'study_groups',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    position: integer('position').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    check('study_groups_title_check', sql`char_length(${table.title}) between 1 and 80`),
    check('study_groups_position_check', sql`${table.position} > 0`),
  ],
);

export const studies = app.table(
  'studies',
  {
    id: text('id').primaryKey(),
    // No cascade: a group with studies cannot be deleted.
    groupId: text('group_id')
      .notNull()
      .references(() => studyGroups.id),
    position: integer('position').notNull(),
    // Shown to learners. Content created in the CMS starts hidden.
    visible: boolean('visible').notNull().default(false),
    title: text('title').notNull(),
    description: text('description').notNull(),
    // Validate with the StudyPage schema from @libras/contracts before writing.
    pages: jsonb('pages').$type<StudyPage[]>().notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    check('studies_position_check', sql`${table.position} > 0`),
    check(
      'studies_pages_check',
      sql`jsonb_typeof(${table.pages}) = 'array' and jsonb_array_length(${table.pages}) > 0`,
    ),
    index('studies_group_id_position_idx').on(table.groupId, table.position),
  ],
);

// User
export const profiles = app.table(
  'profiles',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    dailyGoal: smallint('daily_goal').$type<1 | 3 | 5 | 8>().notNull().default(1),
    startLevel: text('start_level')
      .$type<'beginner' | 'basic' | 'conversational'>()
      .notNull()
      .default('beginner'),
    createdAt: createdAt(),
  },
  (table) => [
    check('profiles_name_check', sql`char_length(${table.name}) between 1 and 60`),
    check('profiles_daily_goal_check', sql`${table.dailyGoal} in (1, 3, 5, 8)`),
    check(
      'profiles_start_level_check',
      sql`${table.startLevel} in ('beginner', 'basic', 'conversational')`,
    ),
  ],
);

export const admins = app.table(
  'admins',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    name: text('name').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: createdAt(),
  },
  (table) => [
    check('admins_email_check', sql`char_length(${table.email}) between 3 and 254`),
    check('admins_name_check', sql`char_length(${table.name}) between 1 and 60`),
  ],
);

// Progress

export const lessonSessions = app.table(
  'lesson_sessions',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'restrict' }),
    idempotencyKey: uuid('idempotency_key').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull(),
    response: jsonb('response').$type<CompleteLessonResponse>().notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    unique('lesson_sessions_user_id_idempotency_key_key').on(table.userId, table.idempotencyKey),
    index('lesson_sessions_user_id_completed_at_idx').on(table.userId, table.completedAt),
    index('lesson_sessions_lesson_id_idx').on(table.lessonId),
  ],
);

export const userLessonProgress = app.table(
  'user_lesson_progress',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'restrict' }),
    completionCount: integer('completion_count').notNull().default(1),
    lastCompletedAt: timestamp('last_completed_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.lessonId] }),
    check('user_lesson_progress_completion_count_check', sql`${table.completionCount} > 0`),
    index('user_lesson_progress_lesson_id_idx').on(table.lessonId),
  ],
);

export const userStats = app.table(
  'user_stats',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    xpTotal: integer('xp_total').notNull().default(0),
    streakCurrent: integer('streak_current').notNull().default(0),
    streakLongest: integer('streak_longest').notNull().default(0),
    // YYYY-MM-DD, the same format as LocalDate.toString().
    lastActiveDate: date('last_active_date', { mode: 'string' }),
    lessonsCompleted: integer('lessons_completed').notNull().default(0),
    perfectLessons: integer('perfect_lessons').notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [
    check('user_stats_xp_total_check', sql`${table.xpTotal} >= 0`),
    check('user_stats_streak_current_check', sql`${table.streakCurrent} >= 0`),
    check('user_stats_streak_longest_check', sql`${table.streakLongest} >= ${table.streakCurrent}`),
    check('user_stats_lessons_completed_check', sql`${table.lessonsCompleted} >= 0`),
    check(
      'user_stats_perfect_lessons_check',
      sql`${table.perfectLessons} between 0 and ${table.lessonsCompleted}`,
    ),
  ],
);

// The achievement catalog is code in the BFF, so achievement_id has no foreign key.
export const userAchievements = app.table(
  'user_achievements',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id').notNull(),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.achievementId] }),
    check(
      'user_achievements_achievement_id_check',
      sql`char_length(${table.achievementId}) between 1 and 60`,
    ),
  ],
);
