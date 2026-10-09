import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';
import { AppText, Button, ScreenTitle, TextField } from '@/shared/ui';

import { fieldErrors, SignInForm, type FieldErrors, type SignInValues } from '../forms';
import { useAuthStore } from '../store/authStore';

export function SignInScreen() {
  const submitting = useAuthStore((state) => state.submitting);
  const error = useAuthStore((state) => state.error);
  const signIn = useAuthStore((state) => state.signIn);
  const clearError = useAuthStore((state) => state.clearError);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors<SignInValues>>({});

  // A failed attempt must not show up later in the onboarding, which shares the error.
  useEffect(() => clearError, [clearError]);

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenTitle title="Entrar" description="Use o e-mail e a senha da sua conta." />
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
        </View>
        {error && (
          <AppText variant="caption" color="danger" align="center">
            {error}
          </AppText>
        )}
      </ScrollView>
      <View style={styles.actions}>
        <Button
          label={submitting ? 'Entrando…' : 'Entrar'}
          onPress={submit}
          disabled={submitting}
        />
        <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing['3xl'],
    paddingTop: spacing.sm,
    paddingHorizontal: spacing['4xl'],
    paddingBottom: spacing['2xl'],
  },
  fields: {
    gap: spacing.xl,
  },
  actions: {
    gap: spacing.sm,
    paddingHorizontal: spacing['4xl'],
    paddingBottom: spacing['2xl'],
  },
});
