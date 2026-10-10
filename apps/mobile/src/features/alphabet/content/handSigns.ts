import type { SignImage } from '@libras/contracts';

export type HandSignKind = 'letter' | 'number';

export type HandSign = {
  id: string;
  kind: HandSignKind;
  /** What the tile shows: "A", "7", "10". */
  label: string;
  image: SignImage;
  hint: string;
};

// The alphabet and number pictures will be bundled with the app. Until they exist, `.invalid`
// never resolves (RFC 2606), so every image fails on purpose and SignImage shows its placeholder.
const placeholderImage = (slug: string, alt: string): SignImage => ({
  url: `https://placeholder.invalid/hand-signs/${slug}.png`,
  alt,
});

const letterHint = 'Mão na altura do ombro, palma voltada para quem conversa com você.';

export const letters: readonly HandSign[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  .split('')
  .map((letter) => ({
    id: `letter-${letter}`,
    kind: 'letter',
    label: letter,
    image: placeholderImage(
      `letter-${letter.toLowerCase()}`,
      `Configuração de mão da letra ${letter}`,
    ),
    hint: letterHint,
  }));

const numberHints = [
  'Dedos curvados formando um círculo com o polegar. Palma para o interlocutor, sem movimento.',
  'Indicador estendido, demais dedos fechados. Palma para o interlocutor.',
  'Indicador e médio estendidos, em V. Palma para o interlocutor.',
  'Indicador, médio e anelar estendidos. Palma para o interlocutor.',
  'Quatro dedos estendidos, polegar dobrado sobre a palma.',
  'Mão aberta, cinco dedos estendidos e afastados.',
  'Indicador, médio e anelar estendidos com o polegar; mínimo dobrado.',
  'Indicador e médio estendidos com o polegar; anelar e mínimo dobrados.',
  'Indicador e polegar estendidos, demais dobrados. Palma para o interlocutor.',
  'Dedos curvados em garra, polegar afastado. Palma para o interlocutor.',
  'Indicador estendido com o polegar para cima; pequeno movimento de balanço.',
] as const;

export const numbers: readonly HandSign[] = numberHints.map((hint, value) => ({
  id: `number-${value}`,
  kind: 'number',
  label: String(value),
  image: placeholderImage(`number-${value}`, `Configuração de mão do número ${value}`),
  hint,
}));

export function findHandSign(id: string): HandSign | undefined {
  return [...letters, ...numbers].find((sign) => sign.id === id);
}
