import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';

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
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  async function handleResetCycle() {
    if (!token) return;
    setShowResetConfirm(false);
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
            onPress={() => setShowResetConfirm(true)}
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

      <Modal visible={showResetConfirm} transparent animationType="fade" onRequestClose={() => setShowResetConfirm(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowResetConfirm(false)}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            <ThemedText type="subtitle" style={styles.dialogTitle}>
              Réinitialiser le cycle
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.dialogMsg}>
              Êtes-vous sûr de vouloir réinitialiser le cycle ? Tous les groupes, messages et disponibilités seront supprimés.
            </ThemedText>
            <ThemedView style={styles.dialogBtns}>
              <PrimaryButton label="Non" variant="outline" onPress={() => setShowResetConfirm(false)} style={styles.dialogBtn} />
              <PrimaryButton label="Oui, réinitialiser" onPress={handleResetCycle} style={styles.dialogBtn} />
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  dialog: { borderRadius: 16, padding: Spacing.four, gap: Spacing.three, width: '100%', maxWidth: 400, backgroundColor: '#1a1a1a' },
  dialogTitle: { fontSize: 18 },
  dialogMsg: { fontSize: 15 },
  dialogBtns: { flexDirection: 'row', gap: Spacing.two },
  dialogBtn: { flex: 1 },
});
