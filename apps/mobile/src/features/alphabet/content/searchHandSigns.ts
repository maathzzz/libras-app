import { letters, numbers, type HandSign } from './handSigns';

export type HandSignResults = {
  letters: readonly HandSign[];
  numbers: readonly HandSign[];
};

const lettersByLabel = new Map(letters.map((sign) => [sign.label, sign]));
const numbersByLabel = new Map(numbers.map((sign) => [sign.label, sign]));

// Accents are dropped because fingerspelling has no separate handshape for "Á" or "Ç".
function normalize(query: string): string {
  return query
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleUpperCase('pt-BR')
    .trim();
}

// A word is spelled letter by letter, in order and with repeats, so searching "casa" shows
// how to fingerspell it. Numbers match only as whole values, so "10" is not read as 1 and 0.
export function searchHandSigns(query: string): HandSignResults {
  const normalized = normalize(query);
  if (!normalized) return { letters, numbers };

  return {
    letters: [...normalized].flatMap((char) => lettersByLabel.get(char) ?? []),
    numbers: (normalized.match(/\d+/g) ?? []).flatMap((value) => numbersByLabel.get(value) ?? []),
  };
}
