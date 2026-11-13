import { randomBytes } from 'node:crypto';

import type { PasswordGenerator } from '../domain/OperatorAccounts';

// 16 random characters (96 bits), letters, digits, - and _, easy to copy.
export class CryptoPasswordGenerator implements PasswordGenerator {
  next(): string {
    return randomBytes(12).toString('base64url');
  }
}
