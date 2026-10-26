import { router } from 'expo-router';

import { useAuthStore } from '../store/authStore';
import { CodeScreen } from './CodeScreen';

export function ResetCodeScreen() {
  const email = useAuthStore((state) => state.resetEmail);
  const verifyResetCode = useAuthStore((state) => state.verifyResetCode);
  const resendResetCode = useAuthStore((state) => state.resendResetCode);

  return (
    <CodeScreen
      title="Digite o código"
      email={email}
      action="Continuar"
      busyAction="Conferindo…"
      onConfirm={verifyResetCode}
      onResend={resendResetCode}
      onConfirmed={() => router.push('/new-password')}
    />
  );
}
