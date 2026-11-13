import type { AdminExerciseType } from '@libras/contracts';

// How each exercise type is named and explained in the CMS.
export const exerciseTypes: Record<AdminExerciseType, { name: string; explanation: string }> = {
  sign_to_word: {
    name: 'Sinal → palavra',
    explanation: 'O aluno vê o sinal da resposta certa e escolhe o nome dele entre as opções.',
  },
  word_to_sign: {
    name: 'Palavra → sinal',
    explanation: 'O aluno lê o nome da resposta certa e escolhe o sinal entre as opções.',
  },
};
