import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { TextField } from '@/shared/ui';

import { EmailForm, fieldErrors, type EmailValues, type FieldErrors } from '../forms';
import { useAuthStore } from '../store/authStore';
import { AuthScreen } from './AuthScreen';

export function ForgotPasswordScreen() {
  // Filled with what was typed on the sign-in screen, if anything.
  const params = useLocalSearchParams<{ email?: string }>();
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset);
  const [email, setEmail] = useState(params.email ?? '');
  const [errors, setErrors] = useState<FieldErrors<EmailValues>>({});

  const submit = async () => {
    const result = EmailForm.safeParse({ email });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    if (await requestPasswordReset(result.data.email)) router.push('/reset-code');
  };

  return (
    <AuthScreen
      title="Recuperar senha"
      description="Informe o e-mail da sua conta. Vamos enviar um código para você criar uma nova senha."
      action="Enviar código"
      busyAction="Enviando…"
      onAction={() => void submit()}
    >
      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        icon="mail"
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />
    </AuthScreen>
  );
}
