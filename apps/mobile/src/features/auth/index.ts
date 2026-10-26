import type { Credentials } from './api/authApi';
import { useAuthStore } from './store/authStore';

export type { Credentials } from './api/authApi';
export { ForgotPasswordScreen } from './components/ForgotPasswordScreen';
export { NewPasswordScreen } from './components/NewPasswordScreen';
export { ResetCodeScreen } from './components/ResetCodeScreen';
export { SignInScreen } from './components/SignInScreen';
export { fieldErrors, SignUpForm, type FieldErrors, type SignUpValues } from './forms';
export type { AuthStatus } from './store/authStore';

export const useAuthStatus = () => useAuthStore((state) => state.status);
export const useAuthSubmitting = () => useAuthStore((state) => state.submitting);
export const useAuthError = () => useAuthStore((state) => state.error);
export const restoreSession = () => useAuthStore.getState().restore();
export const signOut = () => useAuthStore.getState().signOut();
export const signUp = (credentials: Credentials, onAccountCreated?: () => Promise<unknown>) =>
  useAuthStore.getState().signUp(credentials, onAccountCreated);
