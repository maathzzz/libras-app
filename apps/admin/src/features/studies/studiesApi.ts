import {
  AdminStudiesResponse,
  AdminStudy,
  CreatedResponse,
  type AdminStudyGroup,
  type SaveStudyRequest,
} from '@libras/contracts';

import { apiRequest, NoContent } from '@/shared/api/client';

const groupPath = (id: string) => `/v1/admin/study-groups/${encodeURIComponent(id)}`;
const studyPath = (id: string) => `/v1/admin/studies/${encodeURIComponent(id)}`;

export async function getStudyGroups(): Promise<AdminStudyGroup[]> {
  return (await apiRequest('/v1/admin/studies', AdminStudiesResponse)).groups;
}

export async function createStudyGroup(title: string): Promise<string> {
  const { id } = await apiRequest('/v1/admin/study-groups', CreatedResponse, {
    method: 'POST',
    body: { title },
  });
  return id;
}

export async function renameStudyGroup(id: string, title: string): Promise<void> {
  await apiRequest(groupPath(id), NoContent, { method: 'PATCH', body: { title } });
}

export async function deleteStudyGroup(id: string): Promise<void> {
  await apiRequest(groupPath(id), NoContent, { method: 'DELETE' });
}

export async function reorderStudyGroups(ids: readonly string[]): Promise<void> {
  await apiRequest('/v1/admin/study-groups/order', NoContent, { method: 'PUT', body: { ids } });
}

export async function reorderStudies(groupId: string, ids: readonly string[]): Promise<void> {
  await apiRequest(`${groupPath(groupId)}/studies/order`, NoContent, {
    method: 'PUT',
    body: { ids },
  });
}

export async function getStudy(id: string): Promise<AdminStudy> {
  return apiRequest(studyPath(id), AdminStudy);
}

export async function createStudy(study: SaveStudyRequest): Promise<string> {
  const { id } = await apiRequest('/v1/admin/studies', CreatedResponse, {
    method: 'POST',
    body: study,
  });
  return id;
}

export async function updateStudy(id: string, study: SaveStudyRequest): Promise<void> {
  await apiRequest(studyPath(id), NoContent, { method: 'PUT', body: study });
}

export async function setStudyVisibility(id: string, visible: boolean): Promise<void> {
  await apiRequest(`${studyPath(id)}/visibility`, NoContent, { method: 'PUT', body: { visible } });
}

export async function deleteStudy(id: string): Promise<void> {
  await apiRequest(studyPath(id), NoContent, { method: 'DELETE' });
}
