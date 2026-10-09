import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';
import {
  AppText,
  Button,
  Card,
  Header,
  IconButton,
  Pill,
  ProgressBar,
  ScreenTitle,
  type CardTone,
} from '@/shared/ui';

// Temporary screen to validate the design foundation on a device. Remove once real
// screens use these components.

const goals = [
  { id: 'casual', label: 'Casual', sub: '1 lição por dia' },
  { id: 'regular', label: 'Regular', sub: '3 lições por dia' },
  { id: 'serio', label: 'Sério', sub: '5 lições por dia' },
] as const;

const answerTones: readonly CardTone[] = ['success', 'danger', 'warning'];

export function DesignDemoScreen() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<string>('regular');
  const [daily, setDaily] = useState(3);

  const steps = [0, 1, 2, 3].map((index) => (index < step ? 1 : index === step ? 0.45 : 0));
  const advance = () => setStep((current) => (current + 1) % 5);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        onClose={() => router.back()}
        closeLabel="Fechar demonstração"
        steps={steps}
        trailing={<Pill label="24" icon="xp" />}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle
          kicker="Fundação visual"
          title="Design system"
          description="Tela temporária para validar tokens e componentes no aparelho."
        />

        <Section title="Pill">
          <View style={styles.row}>
            <Pill label="7" icon="streak" tone="warning" accessibilityLabel="Sequência de 7 dias" />
            <Pill label="1.240" icon="xp" accessibilityLabel="1.240 XP" />
            <Pill label="3/5" icon="goal" tone="info" accessibilityLabel="3 de 5 lições hoje" />
            <Pill label="5 min por dia" tone="success" />
            <Pill label="mão aberta" tone="neutral" />
          </View>
        </Section>

        <Section title="Button">
          <Button label="Começar agora" onPress={advance} />
          <Button label="Já tenho conta" variant="secondary" onPress={advance} />
          <Button label="Concluir exercício" disabled onPress={advance} />
          <Button label="Sair da conta" variant="danger" onPress={advance} />
          <Button label="Voltar" variant="ghost" onPress={advance} />
        </Section>

        <Section title="ProgressBar">
          <Card>
            <View style={styles.spread}>
              <AppText variant="bodyStrong">Meta diária</AppText>
              <AppText variant="caption">{`${daily} de 5 lições`}</AppText>
            </View>
            <ProgressBar value={daily / 5} accessibilityLabel="Meta diária" />
            <AppText variant="caption">Toque nos botões para animar a barra.</AppText>
          </Card>
          <View style={styles.row}>
            <IconButton
              icon="close"
              filled
              accessibilityLabel="Zerar meta"
              onPress={() => setDaily(0)}
            />
            <View style={styles.fill}>
              <Button
                label="Mais uma lição"
                variant="secondary"
                onPress={() => setDaily((current) => Math.min(5, current + 1))}
              />
            </View>
          </View>
          <AppText variant="caption">
            O Header acima usa a variante pequena em etapas. Toque em um botão para avançar.
          </AppText>
        </Section>

        <Section title="Card">
          <Card>
            <AppText variant="kicker">Continuar onde parou</AppText>
            <AppText variant="heading">Saudações · Lição 2</AppText>
            <AppText variant="body">6 sinais novos · 40 XP em jogo</AppText>
          </Card>
          {goals.map((item) => {
            const selected = item.id === goal;
            return (
              <Card
                key={item.id}
                tone={selected ? 'accent' : 'default'}
                selected={selected}
                accessibilityLabel={`${item.label}, ${item.sub}`}
                onPress={() => setGoal(item.id)}
              >
                <AppText variant="subtitle" color={selected ? 'accent' : 'text'}>
                  {item.label}
                </AppText>
                <AppText variant="caption">{item.sub}</AppText>
              </Card>
            );
          })}
          <View style={styles.row}>
            {answerTones.map((tone) => (
              <View key={tone} style={styles.fill}>
                <Card tone={tone}>
                  <AppText variant="bodyStrong" align="center">
                    {tone}
                  </AppText>
                </Card>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Tipografia">
          <AppText variant="display">+64</AppText>
          <AppText variant="hero">BOM DIA</AppText>
          <AppText variant="title">Título de tela</AppText>
          <AppText variant="heading">Qual destes sinais significa OI?</AppText>
          <AppText variant="subtitle">Subtítulo de opção</AppText>
          <AppText variant="body">
            Texto corrido: trilhas curtas de sinais reais, do alfabeto manual ao dia a dia.
          </AppText>
          <AppText variant="caption">Legenda e textos de apoio.</AppText>
          <AppText variant="kicker">Passo 2 de 3</AppText>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="kicker" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing['5xl'],
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['6xl'],
  },
  section: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  spread: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  fill: {
    flex: 1,
  },
});
