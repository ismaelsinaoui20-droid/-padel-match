import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AdminScreen() {
  const { token, signOut } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  async function handleResetCycle() {
    if (!token) return;
    setIsResetting(true);
    setResetMsg(null);
    try {
      await api.resetCycle(token);
      setResetMsg('Cycle réinitialisé avec succès.');
    } catch {
      setResetMsg('Erreur lors de la réinitialisation.');
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText
          type="link"
          themeColor="danger"
          style={styles.logout}
          onPress={async () => {
            await signOut();
            router.replace('/login');
          }}
        >
          Se déconnecter
        </ThemedText>

        <Card style={styles.card}>
          <PrimaryButton label="🎾 Tous les groupes" onPress={() => router.push('/admin-groups')} />
          <PrimaryButton
            label="👥 Tous les joueurs"
            variant="outline"
            onPress={() => router.push('/admin-players')}
            style={styles.secondButton}
          />
          <PrimaryButton
            label="🚨 Joueurs signalés"
            variant="outline"
            onPress={() => router.push('/admin-reports')}
            style={styles.secondButton}
          />
          <PrimaryButton
            label="🔴 Joueurs bannis"
            variant="outline"
            onPress={() => router.push('/admin-banned')}
            style={styles.secondButton}
          />
          <PrimaryButton
            label={isResetting ? 'Réinitialisation...' : '🔄 Réinitialiser le cycle'}
            variant="outline"
            onPress={handleResetCycle}
            disabled={isResetting}
            style={styles.secondButton}
          />
          {resetMsg && (
            <ThemedText themeColor="textSecondary" style={styles.resetMsg}>
              {resetMsg}
            </ThemedText>
          )}
        </Card>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  logout: { alignSelf: 'flex-end' },
  card: { gap: Spacing.three },
  secondButton: { marginTop: Spacing.one },
  resetMsg: { fontSize: 13, textAlign: 'center', marginTop: Spacing.one },
});
