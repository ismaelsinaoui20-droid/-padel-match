import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { NoTranslate } from '@/components/no-translate';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, type User } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function SavedPlayersScreen() {
  const { token } = useAuth();
  const theme = useTheme();
  const [players, setPlayers] = useState<Pick<User, 'id' | 'name' | 'level'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.getSavedPlayers(token).then((res) => {
      setPlayers(res.players);
      setIsLoading(false);
    });
  }, [token]);

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.primary} size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Joueurs enregistrés
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Les joueurs que tu as enregistrés depuis tes discussions.
            </ThemedText>
          </ThemedView>
        }
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Tu n'as encore enregistré aucun joueur.
          </ThemedText>
        }
        renderItem={({ item }) => (
          <Card style={styles.playerCard}>
            <ThemedView style={styles.playerRow}>
              <ThemedView>
                <ThemedText type="smallBold"><NoTranslate>{item.name}</NoTranslate></ThemedText>
                {item.level && (
                  <ThemedText themeColor="textSecondary" style={styles.level}>
                    Niveau {item.level}
                  </ThemedText>
                )}
              </ThemedView>
              <PrimaryButton
                label="💬 Discuter"
                variant="outline"
                onPress={() =>
                  router.push({ pathname: '/dm/[userId]', params: { userId: item.id, name: item.name } })
                }
                style={styles.chatButton}
              />
            </ThemedView>
          </Card>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: Spacing.four,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: { gap: Spacing.one, marginBottom: Spacing.two },
  title: { fontSize: 26, lineHeight: 32 },
  subtitle: { fontSize: 14 },
  empty: { textAlign: 'center', marginTop: Spacing.five },
  playerCard: { gap: Spacing.half },
  playerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatButton: { paddingHorizontal: Spacing.three },
  level: { fontSize: 13 },
});
