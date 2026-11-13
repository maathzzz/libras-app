import { randomBytes } from 'node:crypto';

import type { IdGenerator } from './IdGenerator';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const LENGTH = 10;

// 36^10 possibilities: a clash among the few thousand ids of the content is negligible, and
// the primary key would refuse it anyway.
export class RandomIdGenerator implements IdGenerator {
  next(prefix: string): string {
    const suffix = Array.from(randomBytes(LENGTH), (byte) => ALPHABET[byte % ALPHABET.length]);
    return `${prefix}-${suffix.join('')}`;
  }
}
