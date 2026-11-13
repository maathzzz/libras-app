import { ApiError } from './client';

const byCode: Record<string, string> = {
  AMBIGUOUS_OPTIONS: 'Duas opções têm o mesmo nome. Escolha sinais com nomes diferentes.',
  UNKNOWN_SIGN: 'Um dos sinais escolhidos não existe mais. Carregamos a versão atual.',
  INVALID_ORDER: 'A lista mudou enquanto você editava. Carregamos a versão atual; tente de novo.',
  STUDY_GROUP_NOT_EMPTY:
    'Este grupo ainda tem estudos. Mova ou exclua os estudos antes de excluí-lo.',
  UNKNOWN_STUDY_GROUP: 'O grupo escolhido não existe mais. Carregamos a versão atual.',
  SIGN_IN_USE: 'Este sinal aparece em exercícios ou estudos e não pode ser excluído.',
  VALIDATION_ERROR: 'Algum campo está inválido. Confira os dados e tente de novo.',
};

// The message an operator sees for a failed request.
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Algo deu errado. Tente de novo.';
  if (error.kind === 'network') return 'Sem resposta do servidor. Verifique a conexão.';
  if (error.code && byCode[error.code]) return byCode[error.code] ?? '';
  if (error.code?.endsWith('_NOT_FOUND')) {
    return 'Este item não existe mais; outra pessoa pode tê-lo excluído. Carregamos a versão atual.';
  }
  return 'Algo deu errado. Tente de novo.';
}
