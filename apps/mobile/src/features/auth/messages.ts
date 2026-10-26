import { AuthFailure, type AuthFailureReason } from './api/authApi';

const messages: Record<AuthFailureReason, string> = {
  invalidCredentials: 'E-mail ou senha incorretos.',
  confirmationRequired:
    'Não foi possível concluir seu cadastro agora. Tente de novo mais tarde ou entre em contato com o suporte.',
  emailInUse: 'Este e-mail já tem uma conta. Entre com ele ou recupere a senha.',
  invalidCode: 'Código inválido ou expirado. Confira o e-mail ou peça um novo código.',
  weakPassword: 'Essa senha é fácil de adivinhar. Escolha outra.',
  samePassword: 'A nova senha precisa ser diferente da antiga.',
  rateLimited: 'Muitas tentativas seguidas. Espere um minuto e tente de novo.',
  offline: 'Sem conexão com a internet. Verifique sua rede e tente de novo.',
  unknown: 'Algo deu errado. Tente de novo.',
};

/** What to show the learner when an auth call fails. */
export function authErrorMessage(error: unknown): string {
  return messages[error instanceof AuthFailure ? error.reason : 'unknown'];
}
