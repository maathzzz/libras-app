import {
  AdminOperatorsResponse,
  TemporaryPasswordResponse,
  type AdminOperator,
  type CreateOperatorRequest,
  type UpdateOperatorRequest,
} from '@libras/contracts';

import { apiRequest, NoContent } from '@/shared/api/client';

const operatorPath = (userId: string) => `/v1/admin/operators/${encodeURIComponent(userId)}`;

export async function getOperators(): Promise<AdminOperator[]> {
  return (await apiRequest('/v1/admin/operators', AdminOperatorsResponse)).operators;
}

// Answers the temporary password, which the BFF never shows again.
export async function createOperator(operator: CreateOperatorRequest): Promise<string> {
  const { temporaryPassword } = await apiRequest('/v1/admin/operators', TemporaryPasswordResponse, {
    method: 'POST',
    body: operator,
  });
  return temporaryPassword;
}

export async function updateOperator(
  userId: string,
  changes: UpdateOperatorRequest,
): Promise<void> {
  await apiRequest(operatorPath(userId), NoContent, { method: 'PATCH', body: changes });
}

export async function resetOperatorPassword(userId: string): Promise<string> {
  const { temporaryPassword } = await apiRequest(
    `${operatorPath(userId)}/password`,
    TemporaryPasswordResponse,
    { method: 'POST' },
  );
  return temporaryPassword;
}
