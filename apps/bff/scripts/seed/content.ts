import {
  Exercise,
  LessonBundle,
  SignImage,
  StudyGuide,
  type SignImageSequence,
  type SignToWordExercise,
  type StudyBlock,
  type StudyPage,
  type WordToSignExercise,
} from '@libras/contracts';

// Seed content for the development project. Only "Alfabeto e numerais" has lessons; the
// other units get theirs when each one is planned.

export interface SeedSign {
  id: string;
  label: string;
  imagePaths: string[];
  alt: string;
  // Visible text on how to perform the sign. Null while nobody has written it.
  description: string | null;
}

export interface SeedExercise {
  lessonId: string;
  position: number;
  payload: Exercise;
  signIds: string[];
}

export interface SeedContent {
  course: { id: string; title: string; position: number };
  units: { id: string; courseId: string; title: string; position: number }[];
  lessons: { id: string; unitId: string; title: string; position: number }[];
  signs: SeedSign[];
  exercises: SeedExercise[];
  studies: SeedStudy[];
}

export interface SeedStudy {
  id: string;
  trailId: string;
  position: number;
  title: string;
  description: string;
  pages: StudyPage[];
}

const OPTIONS_PER_EXERCISE = 4;

// There are no sign pictures yet. `.invalid` never resolves (RFC 2606), so the app shows its
// placeholder with the alt text, as it does with its own mocks.
const placeholderPath = (signId: string, frame: number) =>
  `https://placeholder.invalid/signs/${signId}-${frame}.png`;

// Provisional: needs review by a Libras specialist, like the rest of this text. The alt text
// describes the hand, not the answer, so it does not give the exercise away.
const LETTER_ALT = 'Mão formando uma letra do alfabeto manual';
const LETTERS_WITH_MOVEMENT = new Set(['H', 'J', 'K', 'X', 'Y', 'Z']);

const NUMBER_ALTS = [
  'Dedos curvados formando um círculo com o polegar',
  'Indicador estendido, demais dedos fechados',
  'Indicador e médio estendidos, em V',
  'Indicador, médio e anelar estendidos',
  'Quatro dedos estendidos, polegar dobrado sobre a palma',
  'Mão aberta, cinco dedos estendidos e afastados',
  'Indicador, médio e anelar estendidos com o polegar; mínimo dobrado',
  'Indicador e médio estendidos com o polegar; anelar e mínimo dobrados',
  'Indicador e polegar estendidos, demais dedos dobrados',
  'Dedos curvados em garra, polegar afastado',
  'Indicador estendido com o polegar para cima, com um pequeno balanço',
] as const;

// Provisional, like the alt texts: they need review by a Libras specialist. The letters have
// none yet: a wrong description would teach the wrong hand, so they wait for the specialist.
const NUMBER_DESCRIPTIONS = [
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

function letterSign(letter: string): SeedSign {
  const id = `letter-${letter.toLowerCase()}`;
  const frames = LETTERS_WITH_MOVEMENT.has(letter) ? 2 : 1;
  return {
    id,
    label: letter,
    imagePaths: Array.from({ length: frames }, (_, index) => placeholderPath(id, index + 1)),
    alt: LETTER_ALT,
    description: null,
  };
}

function numberSign(value: number, alt: string): SeedSign {
  const id = `number-${value}`;
  return {
    id,
    label: String(value),
    imagePaths: [placeholderPath(id, 1)],
    alt,
    description: NUMBER_DESCRIPTIONS[value] ?? null,
  };
}

const signs: SeedSign[] = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letterSign),
  ...NUMBER_ALTS.map((alt, value) => numberSign(value, alt)),
];

const signsById = new Map(signs.map((sign) => [sign.id, sign]));

function findSign(id: string): SeedSign {
  const sign = signsById.get(id);
  if (!sign) throw new Error(`Unknown sign ${id}`);
  return sign;
}

// A sign keeps one alt for all its frames; numbering them tells the frames apart.
function imagesOf(sign: SeedSign): SignImageSequence {
  const frames = sign.imagePaths.length;
  return sign.imagePaths.map((url, index) =>
    SignImage.parse({
      url,
      alt: frames > 1 ? `${sign.alt} (imagem ${index + 1} de ${frames})` : sign.alt,
    }),
  );
}

// The distractors are the next signs of the same lesson, so they are signs the learner is
// studying right now. The correct option moves around so it is not always in one spot.
function optionsFor(target: number, lessonSigns: readonly SeedSign[]): SeedSign[] {
  const others = Array.from(
    { length: OPTIONS_PER_EXERCISE - 1 },
    (_, offset) => lessonSigns[(target + offset + 1) % lessonSigns.length],
  ).filter((sign) => sign !== undefined);
  const correct = lessonSigns[target];
  if (!correct || others.length < OPTIONS_PER_EXERCISE - 1) {
    throw new Error(`A lesson needs at least ${OPTIONS_PER_EXERCISE} signs`);
  }

  const slot = target % OPTIONS_PER_EXERCISE;
  return [...others.slice(0, slot), correct, ...others.slice(slot)];
}

function signToWord(lessonId: string, target: SeedSign, options: SeedSign[]): SignToWordExercise {
  return {
    id: `${lessonId}:sign_to_word:${target.id}`,
    type: 'sign_to_word',
    images: imagesOf(target),
    options: options.map((sign) => ({ id: sign.id, label: sign.label })),
    correctOptionId: target.id,
  };
}

function wordToSign(lessonId: string, target: SeedSign, options: SeedSign[]): WordToSignExercise {
  return {
    id: `${lessonId}:word_to_sign:${target.id}`,
    type: 'word_to_sign',
    word: target.label,
    options: options.map((sign) => ({ id: sign.id, images: imagesOf(sign) })),
    correctOptionId: target.id,
  };
}

// Every sign of the lesson is recognized first (sign → word) and then produced (word → sign).
function exercisesFor(lessonId: string, signIds: readonly string[]): Exercise[] {
  const lessonSigns = signIds.map(findSign);
  const recognize = lessonSigns.map((sign, index) =>
    signToWord(lessonId, sign, optionsFor(index, lessonSigns)),
  );
  const produce = lessonSigns.map((sign, index) =>
    wordToSign(lessonId, sign, optionsFor(index, lessonSigns)),
  );
  return [...recognize, ...produce];
}

const COURSE = { id: 'libras-iniciante', title: 'Libras para iniciantes', position: 1 };

const UNIT_TITLES = [
  ['alfabeto-e-numerais', 'Alfabeto e numerais'],
  ['saudacoes', 'Saudações'],
  ['objetos-do-cotidiano', 'Objetos do cotidiano'],
  ['familia-e-parentes', 'Família e parentes'],
  ['conversa-1', 'Conversa 1'],
] as const;

const letters = (list: string) => list.split('').map((letter) => `letter-${letter.toLowerCase()}`);
const numbers = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => `number-${from + index}`);

const ALPHABET_LESSONS = [
  { id: 'alfabeto-vogais', title: 'Vogais', signIds: letters('AEIOU') },
  { id: 'alfabeto-b-g', title: 'B a G', signIds: letters('BCDFG') },
  { id: 'alfabeto-h-m', title: 'H a M', signIds: letters('HJKLM') },
  { id: 'alfabeto-n-s', title: 'N a S', signIds: letters('NPQRS') },
  { id: 'alfabeto-t-z', title: 'T a Z', signIds: letters('TVWXYZ') },
  { id: 'numeros-0-5', title: '0 a 5', signIds: numbers(0, 5) },
  { id: 'numeros-6-10', title: '6 a 10', signIds: numbers(6, 10) },
];

// Validates every lesson with the same schemas the BFF serves, so the seed can never hold
// an exercise the app cannot render.
export function buildSeedContent(): SeedContent {
  const units = UNIT_TITLES.map(([id, title], index) => ({
    id,
    courseId: COURSE.id,
    title,
    position: index + 1,
  }));

  const lessons = ALPHABET_LESSONS.map(({ id, title }, index) => ({
    id,
    unitId: 'alfabeto-e-numerais',
    title,
    position: index + 1,
  }));

  const exercises = ALPHABET_LESSONS.flatMap(({ id, title, signIds }) => {
    const bundle = LessonBundle.parse({ id, title, exercises: exercisesFor(id, signIds) });
    return bundle.exercises.map((exercise, index) => ({
      lessonId: id,
      position: index + 1,
      payload: Exercise.parse(exercise),
      signIds: signIdsOf(exercise),
    }));
  });

  return { course: COURSE, units, lessons, signs, exercises, studies: buildStudies() };
}

// Studies

const text = (body: string): StudyBlock => ({ type: 'text', body });
const tip = (body: string): StudyBlock => ({ type: 'tip', body });

// A sign block carries its own copy of the sign, like an exercise does, so the app gets the
// page in one read. The description comes from the sign, so it is written in one place.
function sign(id: string): StudyBlock {
  const found = findSign(id);
  const block = { type: 'sign' as const, label: found.label, images: imagesOf(found) };
  return found.description === null ? block : { ...block, description: found.description };
}

function letterPage(first: string, last: string): StudyPage {
  const range = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    .split('')
    .filter((letter) => letter >= first && letter <= last);
  return {
    id: `letras-${first.toLowerCase()}-${last.toLowerCase()}`,
    title: `Letras de ${first} a ${last}`,
    blocks: [
      text('Olhe cada imagem com calma e repita a forma da mão. Não precisa decorar tudo agora.'),
      ...range.map((letter) => sign(`letter-${letter.toLowerCase()}`)),
    ],
  };
}

// Provisional text, to be reviewed by a Libras specialist.
const ALPHABET_STUDY: SeedStudy = {
  id: 'alfabeto-manual',
  trailId: COURSE.id,
  position: 1,
  title: 'Alfabeto manual',
  description: 'As 26 letras em Libras, para soletrar nomes e palavras.',
  pages: [
    {
      id: 'o-que-e-datilologia',
      title: 'O que é datilologia',
      blocks: [
        text('Datilologia é soletrar com as mãos. Cada letra do português tem uma forma de mão.'),
        text(
          'Ela serve para nomes de pessoas, lugares e palavras que ainda não têm sinal. Ela não substitui os sinais: quando existe um sinal, use o sinal.',
        ),
        tip(
          'Use a mão que você mais usa. Deixe a mão na altura do ombro, com a palma para quem conversa com você.',
        ),
      ],
    },
    letterPage('A', 'F'),
    letterPage('G', 'L'),
    letterPage('M', 'R'),
    letterPage('S', 'Z'),
    {
      id: 'dicas-para-soletrar',
      title: 'Dicas para soletrar',
      blocks: [
        text('Faça uma letra de cada vez, sem pressa. O braço fica parado.'),
        text('Entre uma palavra e outra, faça uma pausa curta.'),
        text(
          'Quando a mesma letra aparece duas vezes seguidas, como em "Anna", mova a mão um pouco para o lado na segunda letra.',
        ),
        tip(
          'Treine soletrando seu nome na aba Alfabeto. Depois, faça as lições da unidade Alfabeto na trilha.',
        ),
      ],
    },
  ],
};

// Validated with the schema the BFF serves, so the seed can never hold a page the app
// cannot render.
function buildStudies(): SeedStudy[] {
  return [ALPHABET_STUDY].map((study) => ({ ...study, pages: StudyGuide.parse(study).pages }));
}

// Option ids are sign ids, so the options list every sign the exercise shows.
function signIdsOf(exercise: Exercise): string[] {
  return exercise.options.map((option) => option.id);
}
