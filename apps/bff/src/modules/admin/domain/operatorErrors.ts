import { DomainError } from '../../../shared/domain/DomainError';

export const operatorNotFound = (userId: string) =>
  new DomainError('OPERATOR_NOT_FOUND', `Operator ${userId} not found`);
