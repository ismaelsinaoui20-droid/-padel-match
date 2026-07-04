import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { NoTranslate } from '@/components/no-translate';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, type User } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AdminBannedScreen() {
  const { token } = useAuth();
  const theme = useTheme();
  const [players, setPlayers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      api.getBannedPlayers(token).then((res) => {
        setPlayers(res.players);
        setIsLoading(false);
      });
    }, [token])
  );

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
        <ThemedText type="title" style={styles.title}>
          Joueurs bannis ({players.length})
        </ThemedText>
        {players.length === 0 && (
          <ThemedText themeColor="textSecondary">Aucun joueur banni pour l'instant.</ThemedText>
        )}
        {players.map((p) => (
          <Card key={p.id} style={styles.card}>
            <ThemedText type="smallBold">
              🔴 <NoTranslate>{p.name}</NoTranslate>
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.email}>
              {p.email}
            </ThemedText>
            {p.region && (
              <ThemedText themeColor="textSecondary" style={styles.detail}>
                {p.region}{p.level ? ` · ${p.level}` : ''}
              </ThemedText>
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
  title: { fontSize: 22, lineHeight: 28 },
  card: { gap: Spacing.half },
  email: { fontSize: 13 },
  detail: { fontSize: 13 },
});
