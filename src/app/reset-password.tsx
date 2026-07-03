import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { PasswordInput } from '@/components/password-input';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { resetPassword } = useAuth();
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!code || !newPassword) {
      setError('Renseigne le code et ton nouveau mot de passe');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(email, code.trim(), newPassword);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Code invalide ou expiré');
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
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Code envoyé pour {email}. Valable 15 minutes.
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.spamHint}>
            Si tu ne le reçois pas, vérifie tes spams.
          </ThemedText>

          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="Code reçu (6 chiffres)"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />
          <PasswordInput
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChangeText={setNewPassword}
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
  subtitle: { fontSize: 14 },
  spamHint: { fontSize: 12 },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: Spacing.three,
    fontSize: 16,
  },
  error: { fontSize: 14 },
  submit: { marginTop: Spacing.one },
});
