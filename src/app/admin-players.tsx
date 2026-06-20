import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { NoTranslate } from '@/components/no-translate';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, type User } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AdminPlayersScreen() {
  const { token } = useAuth();
  const theme = useTheme();
  const [players, setPlayers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) return;
    const res = await api.getAdminPlayers(token);
    setPlayers(res.players);
    setIsLoading(false);
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
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
          Tous les joueurs ({players.length})
        </ThemedText>
        {players.map((p) => (
          <Card key={p.id} style={styles.playerCard}>
            <ThemedText type="smallBold"><NoTranslate>{p.name}</NoTranslate></ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.playerEmail}>
              {p.email}
            </ThemedText>
            {p.level && <ThemedText themeColor="textSecondary">Niveau {p.level}</ThemedText>}
            <PrimaryButton
              label="✉️ Envoyer un message"
              variant="outline"
              onPress={() => router.push({ pathname: '/dm/[userId]', params: { userId: p.id, name: p.name } })}
              style={styles.messageButton}
            />
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
  playerCard: { gap: Spacing.half },
  playerEmail: { fontSize: 13 },
  messageButton: { marginTop: Spacing.one },
});
