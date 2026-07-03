import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { PasswordInput } from '@/components/password-input';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function NewPasswordScreen() {
  const { email, code } = useLocalSearchParams<{ email: string; code: string }>();
  const { resetPassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!newPassword || !confirmPassword) {
      setError('Remplis les deux champs');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(email, code, newPassword);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la réinitialisation');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Card style={styles.card}>
          <ThemedText type="subtitle" style={styles.title}>
            Nouveau mot de passe
          </ThemedText>

          <ThemedText themeColor="textSecondary" style={styles.label}>
            Nouveau mot de passe :
          </ThemedText>
          <PasswordInput
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <ThemedText themeColor="textSecondary" style={styles.label}>
            Confirmer le nouveau mot de passe :
          </ThemedText>
          <PasswordInput
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {error && (
            <ThemedText themeColor="danger" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <PrimaryButton
            label={isSubmitting ? 'Validation...' : 'Réinitialiser le mot de passe'}
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={styles.submit}
          />
        </Card>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  card: { gap: Spacing.three },
  title: { fontSize: 22, lineHeight: 28 },
  label: { fontSize: 14 },
  error: { fontSize: 14 },
  submit: { marginTop: Spacing.one },
});
