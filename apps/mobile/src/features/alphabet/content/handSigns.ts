import type { SignImage } from '@libras/contracts';

import type { BundledSignImage } from '@/shared/ui';

import letterA from '../../../../assets/images/hand-signs/letter-a.webp';
import letterB from '../../../../assets/images/hand-signs/letter-b.webp';
import letterC from '../../../../assets/images/hand-signs/letter-c.webp';
import letterD from '../../../../assets/images/hand-signs/letter-d.webp';
import letterE from '../../../../assets/images/hand-signs/letter-e.webp';
import letterF from '../../../../assets/images/hand-signs/letter-f.webp';
import number1 from '../../../../assets/images/hand-signs/number-1.webp';
import number2 from '../../../../assets/images/hand-signs/number-2.webp';
import number3 from '../../../../assets/images/hand-signs/number-3.webp';
import number4 from '../../../../assets/images/hand-signs/number-4.webp';

export type HandSignKind = 'letter' | 'number';

export type HandSign = {
  id: string;
  kind: HandSignKind;
  /** What the tile shows: "A", "7", "10". */
  label: string;
  image: SignImage | BundledSignImage;
  /** How to perform the sign, shown below the picture. */
  description: string;
};

// The pictures drawn so far, bundled with the app and keyed by sign id. Metro only bundles
// files imported by a literal path, so each one has its own import.
const bundledPictures: Readonly<Record<string, number>> = {
  'letter-A': letterA,
  'letter-B': letterB,
  'letter-C': letterC,
  'letter-D': letterD,
  'letter-E': letterE,
  'letter-F': letterF,
  'number-1': number1,
  'number-2': number2,
  'number-3': number3,
  'number-4': number4,
};

// A sign without a picture yet points at `.invalid`, which never resolves (RFC 2606), so the
// image fails on purpose and SignImage shows its placeholder.
function handSignImage(id: string, alt: string): SignImage | BundledSignImage {
  const source = bundledPictures[id];
  if (source !== undefined) return { source, alt };
  return { url: `https://placeholder.invalid/hand-signs/${id.toLowerCase()}.png`, alt };
}

// Provisional: the same text for every letter until a Libras specialist writes each one.
const letterDescription = 'Mão na altura do ombro, palma voltada para quem conversa com você.';

export const letters: readonly HandSign[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  .split('')
  .map((letter) => ({
    id: `letter-${letter}`,
    kind: 'letter',
    label: letter,
    image: handSignImage(`letter-${letter}`, `Configuração de mão da letra ${letter}`),
    description: letterDescription,
  }));

const numberDescriptions = [
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

export const numbers: readonly HandSign[] = numberDescriptions.map((description, value) => ({
  id: `number-${value}`,
  kind: 'number',
  label: String(value),
  image: handSignImage(`number-${value}`, `Configuração de mão do número ${value}`),
  description,
}));

export function findHandSign(id: string): HandSign | undefined {
  return [...letters, ...numbers].find((sign) => sign.id === id);
}
