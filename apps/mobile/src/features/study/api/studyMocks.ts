import type { StudiesResponse, StudyBlock, StudyGuide, StudyPage } from '@libras/contracts';

import { letters } from '@/features/alphabet';

// Provisional content: the texts still need review by a Libras specialist. The letter
// pictures come from the alphabet feature, so both screens show the same placeholders.

function letterBlocks(first: string, last: string): StudyBlock[] {
  return letters
    .filter((letter) => letter.label >= first && letter.label <= last)
    .map((letter) => ({ type: 'sign', label: letter.label, images: [letter.image] }));
}

function letterPage(first: string, last: string): StudyPage {
  return {
    id: `letras-${first.toLowerCase()}-${last.toLowerCase()}`,
    title: `Letras de ${first} a ${last}`,
    blocks: [
      {
        type: 'text',
        body: 'Olhe cada imagem com calma e repita a forma da mão. Não precisa decorar tudo agora.',
      },
      ...letterBlocks(first, last),
    ],
  };
}

const alphabetGuide: StudyGuide = {
  id: 'alfabeto-manual',
  trailId: 'primeiros-contatos',
  title: 'Alfabeto manual',
  description: 'As 26 letras em Libras, para soletrar nomes e palavras.',
  pages: [
    {
      id: 'o-que-e-datilologia',
      title: 'O que é datilologia',
      blocks: [
        {
          type: 'text',
          body: 'Datilologia é soletrar com as mãos. Cada letra do português tem uma forma de mão.',
        },
        {
          type: 'text',
          body: 'Ela serve para nomes de pessoas, lugares e palavras que ainda não têm sinal. Ela não substitui os sinais: quando existe um sinal, use o sinal.',
        },
        {
          type: 'tip',
          body: 'Use a mão que você mais usa. Deixe a mão na altura do ombro, com a palma para quem conversa com você.',
        },
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
        { type: 'text', body: 'Faça uma letra de cada vez, sem pressa. O braço fica parado.' },
        { type: 'text', body: 'Entre uma palavra e outra, faça uma pausa curta.' },
        {
          type: 'text',
          body: 'Quando a mesma letra aparece duas vezes seguidas, como em "Anna", mova a mão um pouco para o lado na segunda letra.',
        },
        {
          type: 'tip',
          body: 'Treine soletrando seu nome na aba Alfabeto. Depois, faça as lições da unidade Alfabeto na trilha.',
        },
      ],
    },
  ],
};

const guides: readonly StudyGuide[] = [alphabetGuide];

export function mockStudies(): StudiesResponse {
  return {
    trails: [
      {
        id: 'primeiros-contatos',
        title: 'Primeiros contatos',
        studies: guides.map((guide) => ({
          id: guide.id,
          title: guide.title,
          description: guide.description,
          pageCount: guide.pages.length,
        })),
      },
    ],
  };
}

export function mockStudy(studyId: string): StudyGuide | undefined {
  return guides.find((guide) => guide.id === studyId);
}
