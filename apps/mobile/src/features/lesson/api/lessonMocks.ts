import type { LessonBundle, SignImageSequence } from '@libras/contracts';

// There are no sign pictures yet. `.invalid` never resolves (RFC 2606), so every image
// fails on purpose and SignImage shows its placeholder with the alt text.
const placeholderUrl = (slug: string, frame: number) =>
  `https://placeholder.invalid/signs/${slug}-${frame}.png`;

const sequence = (slug: string, alts: readonly string[]): SignImageSequence =>
  alts.map((alt, index) => ({ url: placeholderUrl(slug, index + 1), alt }));

// The alt text describes the hand, not the word, so it does not give the answer away.
// Signs with movement have one frame per position.
const signs = {
  oi: sequence('oi', ['Mão aberta na altura da têmpora, palma para frente']),
  bomDia: sequence('bom-dia', [
    'Mão em B junto à boca, palma para dentro',
    'Mão em B à frente, na altura do ombro',
  ]),
  tchau: sequence('tchau', ['Mão aberta acima do ombro, acenando para o lado']),
  obrigado: sequence('obrigado', [
    'Mão em L à frente do queixo, palma para dentro',
    'Mão em L afastada para a frente',
  ]),
  agua: sequence('agua', ['Mão em W tocando o canto da boca']),
  porFavor: sequence('por-favor', ['Mãos abertas juntas à frente do peito']),
  casa: sequence('casa', ['Mãos abertas unidas pelas pontas, formando um telhado']),
} satisfies Record<string, SignImageSequence>;

export function mockLesson(lessonId: string): LessonBundle {
  return {
    id: lessonId,
    title: 'Bom dia',
    exercises: [
      {
        id: 'ex-bom-dia',
        type: 'word_to_sign',
        word: 'Bom dia',
        options: [
          { id: 'tchau', images: signs.tchau },
          { id: 'bom-dia', images: signs.bomDia },
          { id: 'obrigado', images: signs.obrigado },
          { id: 'agua', images: signs.agua },
        ],
        correctOptionId: 'bom-dia',
      },
      {
        id: 'ex-oi',
        type: 'sign_to_word',
        images: signs.oi,
        options: [
          { id: 'oi', label: 'Oi' },
          { id: 'tchau', label: 'Tchau' },
          { id: 'bom-dia', label: 'Bom dia' },
          { id: 'casa', label: 'Casa' },
        ],
        correctOptionId: 'oi',
      },
      {
        id: 'ex-obrigado',
        type: 'word_to_sign',
        word: 'Obrigado',
        options: [
          { id: 'por-favor', images: signs.porFavor },
          { id: 'oi', images: signs.oi },
          { id: 'casa', images: signs.casa },
          { id: 'obrigado', images: signs.obrigado },
        ],
        correctOptionId: 'obrigado',
      },
      {
        id: 'ex-tchau',
        type: 'sign_to_word',
        images: signs.tchau,
        options: [
          { id: 'agua', label: 'Água' },
          { id: 'tchau', label: 'Tchau' },
          { id: 'oi', label: 'Oi' },
          { id: 'obrigado', label: 'Obrigado' },
        ],
        correctOptionId: 'tchau',
      },
      {
        id: 'ex-oi-sinal',
        type: 'word_to_sign',
        word: 'Oi',
        options: [
          { id: 'oi', images: signs.oi },
          { id: 'tchau', images: signs.tchau },
          { id: 'agua', images: signs.agua },
          { id: 'bom-dia', images: signs.bomDia },
        ],
        correctOptionId: 'oi',
      },
      {
        id: 'ex-obrigado-sinal',
        type: 'sign_to_word',
        images: signs.obrigado,
        options: [
          { id: 'por-favor', label: 'Por favor' },
          { id: 'bom-dia', label: 'Bom dia' },
          { id: 'obrigado', label: 'Obrigado' },
          { id: 'casa', label: 'Casa' },
        ],
        correctOptionId: 'obrigado',
      },
      {
        id: 'ex-por-favor',
        type: 'word_to_sign',
        word: 'Por favor',
        options: [
          { id: 'casa', images: signs.casa },
          { id: 'obrigado', images: signs.obrigado },
          { id: 'por-favor', images: signs.porFavor },
          { id: 'tchau', images: signs.tchau },
        ],
        correctOptionId: 'por-favor',
      },
    ],
  };
}
