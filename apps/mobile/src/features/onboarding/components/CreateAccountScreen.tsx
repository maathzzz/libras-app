import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { fieldErrors, SignUpForm, type FieldErrors, type SignUpValues } from '@/features/auth';
import { spacing } from '@/shared/theme';
import { TextField } from '@/shared/ui';

import { useOnboardingStore } from '../store/onboardingStore';
import { OnboardingStep } from './OnboardingStep';

// First step: only checks the fields. The account is created at the end of the onboarding.
export function CreateAccountScreen() {
  const saved = useOnboardingStore((state) => state.account);
  const setAccount = useOnboardingStore((state) => state.setAccount);
  const [name, setName] = useState(saved?.name ?? '');
  const [email, setEmail] = useState(saved?.email ?? '');
  const [password, setPassword] = useState(saved?.password ?? '');
  const [errors, setErrors] = useState<FieldErrors<SignUpValues>>({});

  const next = () => {
    const result = SignUpForm.safeParse({ name, email, password });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    setAccount(result.data);
    router.push('/start-level');
  };

  return (
    <OnboardingStep
      step={1}
      title="Crie sua conta"
      description="Para guardar sua sequência e seu progresso."
      action="Continuar"
      onContinue={next}
    >
      <View style={styles.fields}>
        <TextField
          label="Nome"
          value={name}
          onChangeText={setName}
          error={errors.name}
          icon="person"
          placeholder="Como quer ser chamado"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />
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
          placeholder="Pelo menos 6 caracteres"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={next}
        />
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: spacing['3xl'],
  },
});
