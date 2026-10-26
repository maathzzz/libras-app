import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { Button, TextField } from '@/shared/ui';

import { fieldErrors, SignInForm, type FieldErrors, type SignInValues } from '../forms';
import { useAuthStore } from '../store/authStore';
import { AuthScreen } from './AuthScreen';

export function SignInScreen() {
  const signIn = useAuthStore((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors<SignInValues>>({});

  const submit = () => {
    const result = SignInForm.safeParse({ email, password });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    // On success the session guard leaves the auth screens on its own.
    void signIn(result.data);
  };

  return (
    <AuthScreen
      title="Entrar"
      description="Use o e-mail e a senha da sua conta."
      action="Entrar"
      busyAction="Entrando…"
      onAction={submit}
    >
      <View style={styles.fields}>
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
          returnKeyType="next"
        />
        <TextField
          label="Senha"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          icon="password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <Button
          label="Esqueci minha senha"
          variant="ghost"
          onPress={() =>
            router.push({ pathname: '/forgot-password', params: { email: email.trim() } })
          }
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: spacing.xl,
  },
});
