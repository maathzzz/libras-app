import { AdminMeResponse } from '@libras/contracts';

import { apiRequest } from '@/shared/api/client';

// 403 NOT_ADMIN when the signed-in account is not an active operator.
export function getAdminMe(): Promise<AdminMeResponse> {
  return apiRequest('/v1/admin/me', AdminMeResponse);
}
