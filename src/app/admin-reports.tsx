import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { NoTranslate } from '@/components/no-translate';
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

  const refresh = useCallback(async () => {
    if (!token) return;
    const res = await api.getAdminReports(token);
    setReports(res.reports);
    setIsLoading(false);
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
});
