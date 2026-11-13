import type { AdminOperatorsResponse } from '@libras/contracts';

import type { AdminRepository } from '../domain/AdminRepository';

export class GetOperators {
  constructor(private readonly admins: AdminRepository) {}

  async execute(): Promise<AdminOperatorsResponse> {
    return { operators: await this.admins.list() };
  }
}
