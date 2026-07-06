import { Link, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { UnreadBadge } from '@/components/unread-badge';
import { api, type MatchGroup } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDateLabel } from '@/lib/format-date';
import { isMatchPast } from '@/lib/is-past';

function GroupCard({ group }: { group: MatchGroup }) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(group.status === 'FULL' ? 0 : 1)).current;
  const isFull = group.status === 'FULL';

  useEffect(() => {
    if (isFull) {
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [isFull, opacity]);

  const filled = group.members.length;
  const slots = Array.from({ length: 4 }, (_, i) => i < filled);
  const isDone = group.status === 'CONFIRMED' && isMatchPast(group.date, group.confirmedTime);

  return (
    <Card style={styles.card}>
      <ThemedView style={styles.cardHeader}>
        <ThemedView style={styles.cardHeaderRow}>
          <ThemedText type="subtitle" style={styles.dayName}>
            {formatDateLabel(group.date)}
          </ThemedText>
          {isDone && (
            <ThemedView style={[styles.doneBadge, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                ✅ Terminé
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
        <ThemedText themeColor="textSecondary" style={styles.level}>
          Niveau {group.level} · {group.region}
          {group.isDuo ? ' · 👥 Binôme' : ''}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.slotRow}>
        {slots.map((isFilled, i) => (
          <ThemedView
            key={i}
            style={[
              styles.slot,
              { borderColor: theme.border },
              isFilled && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
          >
            <ThemedText
              type="smallBold"
              style={{ color: isFilled ? theme.textOnPrimary : theme.textSecondary }}
            >
              {isFilled ? '✓' : i + 1}
            </ThemedText>
          </ThemedView>
        ))}
      </ThemedView>

      {group.status === 'CONFIRMED' && group.courtBooked ? (
        <Animated.View style={{ opacity, alignItems: 'center', gap: Spacing.two }}>
          <ThemedText style={[styles.celebrate, { color: theme.primary }]}>
            🔒 Match confirmé à {group.confirmedTime}
          </ThemedText>
          <Pressable onPress={() => router.push(`/chat/${group.id}`)} style={styles.chatRow}>
            <ThemedView style={styles.chatIconWrap}>
              <ThemedText style={styles.chatIcon}>💬</ThemedText>
              <ThemedView style={styles.chatBadgePos}>
                <UnreadBadge count={group.unreadCount} />
              </ThemedView>
            </ThemedView>
            <PrimaryButton
              label="Voir le chat"
              variant="outline"
              onPress={() => router.push(`/chat/${group.id}`)}
              style={styles.chatButton}
            />
          </Pressable>
        </Animated.View>
      ) : group.status === 'CONFIRMED' ? (
        <Animated.View style={{ opacity, alignItems: 'center', gap: Spacing.two }}>
          <ThemedText style={[styles.celebrate, { color: theme.primary }]}>
            ⏰ Horaire décidé à {group.confirmedTime} — réservez le terrain !
          </ThemedText>
          <Pressable onPress={() => router.push(`/chat/${group.id}`)} style={styles.chatRow}>
            <ThemedView style={styles.chatIconWrap}>
              <ThemedText style={styles.chatIcon}>💬</ThemedText>
              <ThemedView style={styles.chatBadgePos}>
                <UnreadBadge count={group.unreadCount} />
              </ThemedView>
            </ThemedView>
            <PrimaryButton
              label="Ouvrir le chat"
              onPress={() => router.push(`/chat/${group.id}`)}
              style={styles.chatButton}
            />
          </Pressable>
        </Animated.View>
      ) : isFull ? (
        <Animated.View style={{ opacity, alignItems: 'center', gap: Spacing.two }}>
          <ThemedText style={[styles.celebrate, { color: theme.primary }]}>🎾 Groupe complet !</ThemedText>
          <Pressable onPress={() => router.push(`/chat/${group.id}`)} style={styles.chatRow}>
            <ThemedView style={styles.chatIconWrap}>
              <ThemedText style={styles.chatIcon}>💬</ThemedText>
              <ThemedView style={styles.chatBadgePos}>
                <UnreadBadge count={group.unreadCount} />
              </ThemedView>
            </ThemedView>
            <PrimaryButton
              label="Rejoindre le chat"
              onPress={() => router.push(`/chat/${group.id}`)}
              style={styles.chatButton}
            />
          </Pressable>
        </Animated.View>
      ) : (
        <ThemedView style={styles.waitingRow}>
          <ActivityIndicator color={theme.primary} />
          <ThemedText themeColor="textSecondary">{filled} / 4 joueurs réunis</ThemedText>
        </ThemedView>
      )}
    </Card>
  );
}

export default function MatchingScreen() {
  const { token } = useAuth();
  const theme = useTheme();
  const [groups, setGroups] = useState<MatchGroup[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadStatus = useCallback(async () => {
    if (!token) return;
    try {
      const result = await api.getMatchStatus(token);
      setGroups(result.groups);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Chargement impossible');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!token) return;
    const fetchUnread = () => api.getUnreadDmCount(token).then((res) => setUnreadCount(res.count));
    fetchUnread();
    const unreadInterval = setInterval(fetchUnread, 15000);
    const statusInterval = setInterval(async () => {
      const status = await api.getMatchStatus(token);
      setGroups(status.groups);
    }, 30000);
    return () => {
      clearInterval(unreadInterval);
      clearInterval(statusInterval);
    };
  }, [token]);

  const hasDuoGroup = groups.some((g) => g.isDuo);

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.primary} size="large" />
        <ThemedText themeColor="textSecondary">Chargement de tes groupes...</ThemedText>
      </ThemedView>
    );
  }

  if (loadError) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="danger">{loadError}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Mes groupes
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Un groupe par date disponible. Le chat s'ouvre dès qu'un groupe atteint 4 joueurs.
        </ThemedText>

        <ThemedView style={styles.quickLinks}>
          <Link href="/account" style={styles.quickLink}>
            <ThemedText type="link" themeColor="primaryStrong">
              👤 Mon compte
            </ThemedText>
          </Link>
          <Link href="/messages" style={styles.quickLink}>
            <ThemedView style={styles.quickLinkRow}>
              <ThemedText type="link" themeColor="primaryStrong">
                💬 Messages
              </ThemedText>
              <UnreadBadge count={unreadCount} />
            </ThemedView>
          </Link>
          <Link href="/duo" style={styles.quickLink}>
            <ThemedText type="link" themeColor="primaryStrong">
              👥 S'inscrire en binôme
            </ThemedText>
          </Link>
          <Link href="/search-player" style={styles.quickLink}>
            <ThemedText type="link" themeColor="primaryStrong">
              🔍 Rechercher un joueur
            </ThemedText>
          </Link>
        </ThemedView>

        {!hasDuoGroup && (
          <PrimaryButton
            label="🔍 Chercher des partenaires"
            onPress={() => router.push('/availability')}
            style={styles.searchButton}
          />
        )}

        {groups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  content: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  title: { fontSize: 28, lineHeight: 34, alignSelf: 'flex-start' },
  subtitle: { fontSize: 14, alignSelf: 'flex-start', marginBottom: Spacing.one },
  quickLinks: { flexDirection: 'row', gap: Spacing.four, alignSelf: 'flex-start', marginBottom: Spacing.one },
  quickLink: { alignSelf: 'flex-start' },
  quickLinkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, backgroundColor: 'transparent' },
  searchButton: { alignSelf: 'flex-start' },
  searchError: { fontSize: 14 },
  card: { width: '100%', gap: Spacing.two },
  cardHeader: { alignItems: 'center', gap: Spacing.half },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  doneBadge: { paddingVertical: 2, paddingHorizontal: Spacing.two, borderRadius: 999 },
  dayName: { fontSize: 22 },
  level: { fontSize: 14 },
  slotRow: { flexDirection: 'row', gap: Spacing.three, justifyContent: 'center', marginVertical: Spacing.one },
  slot: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  celebrate: { fontSize: 18, fontWeight: '800' },
  chatButton: { minWidth: 200 },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  chatIconWrap: { position: 'relative' },
  chatIcon: { fontSize: 26 },
  chatBadgePos: { position: 'absolute', top: -6, right: -10 },
});
