import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Feedback must be felt as well as seen: deaf learners get no sound cue. Android uses the
// native haptic constants (the Vibrator-based notificationAsync is discouraged there).
async function play(android: Haptics.AndroidHaptics, ios: Haptics.NotificationFeedbackType) {
  try {
    if (Platform.OS === 'android') {
      await Haptics.performAndroidHapticsAsync(android);
    } else {
      await Haptics.notificationAsync(ios);
    }
  } catch {
    // Devices without haptics simply skip it; the visual feedback is still there.
  }
}

export const haptics = {
  correct: () => play(Haptics.AndroidHaptics.Confirm, Haptics.NotificationFeedbackType.Success),
  wrong: () => play(Haptics.AndroidHaptics.Reject, Haptics.NotificationFeedbackType.Error),
};
