import { describe, expect, it } from 'vitest';

import { CreateOperatorRequest, UpdateOperatorRequest } from './admin';

describe('operator contracts', () => {
  it('normalizes the e-mail and trims the name of a new operator', () => {
    expect(CreateOperatorRequest.parse({ email: ' Ana+CMS@Example.com ', name: ' Ana ' })).toEqual({
      email: 'ana+cms@example.com',
      name: 'Ana',
    });
  });

  it('refuses an invalid e-mail and an empty name', () => {
    expect(CreateOperatorRequest.safeParse({ email: 'ana', name: 'Ana' }).success).toBe(false);
    expect(UpdateOperatorRequest.safeParse({ name: '  ', active: true }).success).toBe(false);
  });
});
