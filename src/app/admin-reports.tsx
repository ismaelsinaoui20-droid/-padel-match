import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { NoTranslate } from '@/components/no-translate';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Report = {
  id: string;
  reason: string;
  createdAt: string;
  reportedUser: { id: string; name: string; email: string; isBanned: boolean };
  user: { id: string; name: string };
};

export default function AdminReportsScreen() {
  const { token } = useAuth();
  const theme = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [banned, setBanned] = useState<Set<string>>(new Set());
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | null>(null);
  const [isBanning, setIsBanning] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    const res = await api.getAdminReports(token);
    setReports(res.reports);
    setBanned(new Set(res.reports.filter((r) => r.reportedUser.isBanned).map((r) => r.reportedUser.id)));
    setIsLoading(false);
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function executeBan() {
    if (!token || !confirmTarget) return;
    setIsBanning(true);
    try {
      await api.banPlayer(token, confirmTarget.id);
      setBanned((prev) => new Set([...prev, confirmTarget.id]));
      setConfirmTarget(null);
    } catch (e) {
      setConfirmTarget(null);
    } finally {
      setIsBanning(false);
    }
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.primary} size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.sectionTitle}>
          Joueurs signalés ({reports.length})
        </ThemedText>
        {reports.length === 0 && (
          <ThemedText themeColor="textSecondary">Aucun signalement pour l'instant.</ThemedText>
        )}
        {reports.map((r) => (
          <Card key={r.id} style={styles.reportCard}>
            <ThemedText type="smallBold">
              🚨 <NoTranslate>{r.reportedUser.name}</NoTranslate>
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.email}>
              {r.reportedUser.email}
            </ThemedText>
            <ThemedText style={styles.motifLabel}>Motif du signalement :</ThemedText>
            <ThemedText themeColor="textSecondary">{r.reason}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.reporter}>
              Signalé par : <NoTranslate>{r.user.name}</NoTranslate>
            </ThemedText>
            {banned.has(r.reportedUser.id) ? (
              <ThemedText themeColor="danger" style={styles.bannedLabel}>
                🔴 Joueur banni
              </ThemedText>
            ) : (
              <PrimaryButton
                label="🔨 Bannir le joueur"
                variant="outline"
                onPress={() => setConfirmTarget({ id: r.reportedUser.id, name: r.reportedUser.name })}
                style={styles.banBtn}
              />
            )}
          </Card>
        ))}
      </ScrollView>

      <Modal visible={!!confirmTarget} transparent animationType="fade" onRequestClose={() => setConfirmTarget(null)}>
        <Pressable style={styles.overlay} onPress={() => setConfirmTarget(null)}>
          <Pressable style={[styles.dialog, { backgroundColor: theme.background }]} onPress={() => {}}>
            <ThemedText type="subtitle" style={styles.dialogTitle}>
              Bannir le joueur
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.dialogMsg}>
              Voulez-vous vraiment bannir{' '}
              <ThemedText type="smallBold">
                <NoTranslate>{confirmTarget?.name ?? ''}</NoTranslate>
              </ThemedText>{' '}
              ? Il n'aura plus accès à l'application.
            </ThemedText>
            <ThemedView style={styles.dialogBtns}>
              <PrimaryButton
                label="Non"
                variant="outline"
                onPress={() => setConfirmTarget(null)}
                style={styles.dialogBtn}
              />
              <PrimaryButton
                label={isBanning ? '...' : 'Oui, bannir'}
                onPress={executeBan}
                disabled={isBanning}
                style={styles.dialogBtn}
              />
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
  reportCard: { gap: Spacing.half },
  email: { fontSize: 13 },
  motifLabel: { fontSize: 14, marginTop: Spacing.one },
  reporter: { fontSize: 13, marginTop: Spacing.one },
  banBtn: { marginTop: Spacing.two },
  bannedLabel: { fontSize: 14, marginTop: Spacing.two },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  dialog: { borderRadius: 16, padding: Spacing.four, gap: Spacing.three, width: '100%', maxWidth: 400 },
  dialogTitle: { fontSize: 18 },
  dialogMsg: { fontSize: 15 },
  dialogBtns: { flexDirection: 'row', gap: Spacing.two },
  dialogBtn: { flex: 1 },
});
