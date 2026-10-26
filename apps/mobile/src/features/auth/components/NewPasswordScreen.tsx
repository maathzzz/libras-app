import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { TextField } from '@/shared/ui';

import { fieldErrors, NewPasswordForm, type FieldErrors, type NewPasswordValues } from '../forms';
import { useAuthStore } from '../store/authStore';
import { AuthScreen } from './AuthScreen';

// Saving the password signs the learner in, and the session guard takes them to the home.
export function NewPasswordScreen() {
  const setNewPassword = useAuthStore((state) => state.setNewPassword);
  const cancelPasswordReset = useAuthStore((state) => state.cancelPasswordReset);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors<NewPasswordValues>>({});

  // Leaving by any way (button, gesture, Android back) without a new password ends the
  // session the code opened. After a successful save there is nothing left to cancel.
  useEffect(() => () => void cancelPasswordReset(), [cancelPasswordReset]);

  const submit = async () => {
    const result = NewPasswordForm.safeParse({ password });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    await setNewPassword(result.data.password);
  };

  return (
    <AuthScreen
      title="Crie uma nova senha"
      description="Depois de salvar, você já entra no app com ela."
      action="Salvar nova senha"
      busyAction="Salvando…"
      onAction={() => void submit()}
      // The code was already used: going back to it would lead nowhere.
      onBack={() => router.dismissTo('/sign-in')}
    >
      <TextField
        label="Nova senha"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        icon="password"
        placeholder="Pelo menos 6 caracteres"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />
    </AuthScreen>
  );
}
