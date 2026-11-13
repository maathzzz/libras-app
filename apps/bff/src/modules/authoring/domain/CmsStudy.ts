import {
  StudyPage,
  type AdminStudyGroup,
  type SaveStudyPage,
  type StudyBlock,
} from '@libras/contracts';

import { DomainError } from '../../../shared/domain/DomainError';
import { imagesOf } from './CmsExercise';
import type { CmsSign } from './CmsSignRepository';

export interface CmsStudy {
  id: string;
  groupId: string;
  title: string;
  description: string;
  pages: StudyPage[];
}

// A study as stored, with whether learners see it. Created hidden.
export type StoredStudy = CmsStudy & { visible: boolean };

export const studyNotFound = (id: string) =>
  new DomainError('STUDY_NOT_FOUND', `Study ${id} not found`);

export const studyGroupNotFound = (id: string) =>
  new DomainError('STUDY_GROUP_NOT_FOUND', `Study group ${id} not found`);

// The group named in the body of a request, not in its URL.
export const unknownStudyGroup = (id: string) =>
  new DomainError('UNKNOWN_STUDY_GROUP', `Study group ${id} not found`);

// A sign block as the app receives it, with its own copy of the sign.
export function signBlock(sign: CmsSign): StudyBlock {
  const block = {
    type: 'sign' as const,
    signId: sign.id,
    label: sign.label,
    images: imagesOf(sign),
  };
  return sign.description === null ? block : { ...block, description: sign.description };
}

// The signs a study shows, in no particular order.
export function signIdsOf(pages: readonly SaveStudyPage[]): string[] {
  const ids = pages.flatMap((page) =>
    page.blocks.flatMap((block) => (block.type === 'sign' ? [block.signId] : [])),
  );
  return [...new Set(ids)];
}

// The pages the app receives. `signs` has every sign the pages name; a page without an id
// gets one from `newPageId`.
export function buildStudyPages(
  pages: readonly SaveStudyPage[],
  signs: ReadonlyMap<string, CmsSign>,
  newPageId: () => string,
): StudyPage[] {
  return pages.map((page) =>
    StudyPage.parse({
      id: page.id ?? newPageId(),
      title: page.title,
      blocks: page.blocks.map((block) => {
        if (block.type !== 'sign') return block;
        const sign = signs.get(block.signId);
        if (!sign) throw new Error(`Sign ${block.signId} missing while building a study page`);
        return signBlock(sign);
      }),
    }),
  );
}

// The pages with their copy of `sign` brought up to date, after the sign was edited.
export function withSignInPages(pages: readonly StudyPage[], sign: CmsSign): StudyPage[] {
  return pages.map((page) =>
    StudyPage.parse({
      ...page,
      blocks: page.blocks.map((block) =>
        block.type === 'sign' && block.signId === sign.id ? signBlock(sign) : block,
      ),
    }),
  );
}

export type DeleteStudyGroupOutcome = 'deleted' | 'notFound' | 'notEmpty';
export type UpdateStudyOutcome = 'updated' | 'notFound' | 'groupNotFound';

export interface CmsStudyRepository {
  // Every group (empty ones too) with its studies, both in order.
  listGroups(): Promise<AdminStudyGroup[]>;
  listGroupIds(): Promise<string[]>;
  // Adds the group at the end.
  createGroup(group: { id: string; title: string }): Promise<void>;
  // False when the group does not exist.
  renameGroup(id: string, title: string): Promise<boolean>;
  // A group with studies stays: 'notEmpty'.
  deleteGroup(id: string): Promise<DeleteStudyGroupOutcome>;
  // Positions 1..n in the order of `ids`, which are exactly the groups.
  reorderGroups(ids: readonly string[]): Promise<void>;

  find(id: string): Promise<StoredStudy | null>;
  // Ids of the studies of a group, in order. Null when the group does not exist.
  listStudyIds(groupId: string): Promise<string[] | null>;
  // Adds the study, hidden, at the end of its group. False when the group does not exist.
  create(study: CmsStudy): Promise<boolean>;
  // Replaces every field but the visibility. A study moved to another group goes to the end
  // of that group.
  update(study: CmsStudy): Promise<UpdateStudyOutcome>;
  // False when the study does not exist.
  setVisible(id: string, visible: boolean): Promise<boolean>;
  // False when the study does not exist.
  delete(id: string): Promise<boolean>;
  // Positions 1..n in the order of `ids`, which are exactly the studies of the group.
  reorderStudies(groupId: string, ids: readonly string[]): Promise<void>;
}
