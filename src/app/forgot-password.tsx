import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const { prefilledEmail } = useLocalSearchParams<{ prefilledEmail?: string }>();
  const [email, setEmail] = useState(prefilledEmail ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const { resetCode } = await api.forgotPassword(email.trim());
      router.push({
        pathname: '/reset-password',
        params: { email: email.trim(), devCode: resetCode },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de générer un code');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Card style={styles.card}>
          <ThemedText type="subtitle" style={styles.title}>
            Mot de passe oublié
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Indique ton email, on te donne un code pour réinitialiser ton mot de passe.
          </ThemedText>

          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {error && (
            <ThemedText themeColor="danger" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <PrimaryButton
            label={isSubmitting ? 'Envoi...' : 'Obtenir le code'}
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
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: Spacing.three,
    fontSize: 16,
  },
  error: { fontSize: 14 },
  submit: { marginTop: Spacing.one },
});
