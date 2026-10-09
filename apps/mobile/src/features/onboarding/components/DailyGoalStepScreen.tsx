import { router } from 'expo-router';

import { useAuthError, useAuthSubmitting } from '@/features/auth';
import { DailyGoalOptions } from '@/features/profile';
import { AppText } from '@/shared/ui';

import { useOnboardingStore } from '../store/onboardingStore';
import { OnboardingStep } from './OnboardingStep';

// Last step: creates the account with everything chosen. On success the session guard
// takes the learner to the home on its own.
export function DailyGoalStepScreen() {
  const hasAccount = useOnboardingStore((state) => state.account !== null);
  const dailyGoal = useOnboardingStore((state) => state.dailyGoal);
  const setDailyGoal = useOnboardingStore((state) => state.setDailyGoal);
  const createAccount = useOnboardingStore((state) => state.createAccount);
  const submitting = useAuthSubmitting();
  const error = useAuthError();

  // Without the first step's data (e.g. a deep link) there is nothing to create yet.
  const finish = () => {
    if (!hasAccount) {
      router.replace('/sign-up');
      return;
    }
    void createAccount();
  };

  return (
    <OnboardingStep
      step={3}
      title="Qual é a sua meta diária?"
      description="Quantas lições você quer fazer por dia. Uma lição já mantém sua sequência."
      action={submitting ? 'Criando…' : 'Criar minha trilha'}
      onContinue={finish}
      busy={submitting}
    >
      <DailyGoalOptions value={dailyGoal} onChange={setDailyGoal} />
      {error && (
        <AppText variant="caption" color="danger" align="center">
          {error}
        </AppText>
      )}
    </OnboardingStep>
  );
}
