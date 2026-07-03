import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native';

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
  reportedUser: { id: string; name: string; email: string };
  user: { id: string; name: string };
};

export default function AdminReportsScreen() {
  const { token } = useAuth();
  const theme = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [banned, setBanned] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!token) return;
    const res = await api.getAdminReports(token);
    setReports(res.reports);
    setIsLoading(false);
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function confirmBan(playerId: string, playerName: string) {
    Alert.alert(
      'Bannir le joueur',
      `Voulez-vous vraiment bannir ${playerName} ? Il n'aura plus accès à l'application.`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, bannir',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              await api.banPlayer(token, playerId);
              setBanned((prev) => new Set([...prev, playerId]));
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de bannir');
            }
          },
        },
      ]
    );
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
                onPress={() => confirmBan(r.reportedUser.id, r.reportedUser.name)}
                style={styles.banBtn}
              />
            )}
          </Card>
        ))}
      </ScrollView>
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
});
