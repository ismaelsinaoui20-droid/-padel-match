import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
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

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await signUp(name.trim(), email.trim(), password);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inscription impossible');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.hero}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} contentFit="contain" />
          <ThemedText themeColor="textSecondary" style={styles.tagline}>
            Crée ton profil joueur en 30 secondes
          </ThemedText>
        </ThemedView>

        <Card style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Inscription
          </ThemedText>

          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="Nom et prénom"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <PasswordInput
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
          />

          {error && (
            <ThemedText themeColor="danger" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <PrimaryButton
            label={isSubmitting ? 'Création...' : "S'inscrire"}
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={styles.submit}
          />

          <Link href="/login" style={styles.link}>
            <ThemedText type="link" themeColor="primaryStrong">
              Déjà un compte ? Connecte-toi
            </ThemedText>
          </Link>
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
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: Spacing.two },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
    marginBottom: Spacing.two,
  },
  tagline: { textAlign: 'center', fontSize: 16 },
  card: { gap: Spacing.three },
  cardTitle: { fontSize: 22, lineHeight: 28, marginBottom: Spacing.one },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: Spacing.three,
    fontSize: 16,
  },
  error: { fontSize: 14 },
  submit: { marginTop: Spacing.one },
  link: { alignSelf: 'center', marginTop: Spacing.one },
});
