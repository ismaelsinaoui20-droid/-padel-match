import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { NoTranslate } from '@/components/no-translate';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UnreadBadge } from '@/components/unread-badge';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, type Conversation } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function MessagesScreen() {
  const { token } = useAuth();
  const theme = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.getConversations(token).then((res) => {
      setConversations(res.conversations);
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
        data={conversations}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Messages privés
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Toutes tes conversations, même celles reçues de joueurs que tu n'as pas enregistrés.
            </ThemedText>
          </ThemedView>
        }
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Aucune conversation pour le moment.
          </ThemedText>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/dm/[userId]', params: { userId: item.userId, name: item.name } })
            }
          >
            <Card style={styles.conversationCard}>
              <ThemedView style={styles.conversationHeaderRow}>
                <ThemedText type="smallBold"><NoTranslate>{item.name}</NoTranslate></ThemedText>
                <UnreadBadge count={item.unreadCount} />
              </ThemedView>
              <ThemedText themeColor="textSecondary" style={styles.preview} numberOfLines={1}>
                {item.fromMe ? 'Toi : ' : ''}
                {item.lastMessage}
              </ThemedText>
            </Card>
          </Pressable>
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
  conversationCard: { gap: Spacing.half },
  conversationHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, backgroundColor: 'transparent' },
  preview: { fontSize: 13 },
});
