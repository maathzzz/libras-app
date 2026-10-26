import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText, Button, TextField } from '@/shared/ui';

import { codeLength, CodeForm, fieldErrors, type CodeValues, type FieldErrors } from '../forms';
import { AuthScreen } from './AuthScreen';

type CodeScreenProps = {
  title: string;
  /** Where the code was sent; null if the screen was opened without asking for one. */
  email: string | null;
  action: string;
  busyAction: string;
  /** Resolves to true when the code was accepted. */
  onConfirm: (code: string) => Promise<boolean>;
  onResend: () => Promise<boolean>;
  onConfirmed?: () => void;
};

const onlyDigits = (value: string) => value.replace(/\D/g, '').slice(0, codeLength);

// The 6-digit code Supabase sends by e-mail to reset the password.
export function CodeScreen({
  title,
  email,
  action,
  busyAction,
  onConfirm,
  onResend,
  onConfirmed,
}: CodeScreenProps) {
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<FieldErrors<CodeValues>>({});
  const [resent, setResent] = useState(false);

  const confirm = async () => {
    const result = CodeForm.safeParse({ code });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    if (await onConfirm(result.data.code)) onConfirmed?.();
  };

  const resend = async () => {
    setResent(false);
    if (await onResend()) {
      setCode('');
      setResent(true);
    }
  };

  return (
    <AuthScreen
      title={title}
      description={
        email
          ? `Enviamos um código de ${codeLength} números para ${email}. Ele vale por pouco tempo.`
          : `Digite o código de ${codeLength} números que enviamos para o seu e-mail.`
      }
      action={action}
      busyAction={busyAction}
      onAction={() => void confirm()}
    >
      <TextField
        label="Código"
        value={code}
        onChangeText={(value) => setCode(onlyDigits(value))}
        error={errors.code}
        icon="password"
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={codeLength}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        returnKeyType="go"
        onSubmitEditing={() => void confirm()}
      />
      <View style={styles.resend}>
        <AppText variant="caption" align="center">
          Não chegou? Veja também a caixa de spam.
        </AppText>
        <Button
          label="Enviar outro código"
          variant="ghost"
          onPress={() => void resend()}
        />
        {resent && (
          <View accessibilityLiveRegion="polite">
            <AppText variant="caption" color="success" align="center">
              Pronto! Enviamos um novo código.
            </AppText>
          </View>
        )}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  resend: {
    gap: spacing.xs,
  },
});
