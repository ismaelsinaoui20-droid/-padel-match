import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UnreadBadge } from '@/components/unread-badge';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AccountScreen() {
  const { token, user, signOut } = useAuth();
  const theme = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    const fetchUnread = () => api.getUnreadDmCount(token).then((res) => setUnreadCount(res.count));
    fetchUnread();
    const interval = setInterval(fetchUnread, 4000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            NOM ET PRÉNOM
          </ThemedText>
          <ThemedText style={styles.value}>{user?.name ?? '—'}</ThemedText>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            ÂGE
          </ThemedText>
          <ThemedText style={styles.value}>{user?.age ? `${user.age} ans` : '—'}</ThemedText>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            NIVEAU
          </ThemedText>
          <ThemedText style={styles.value}>{user?.level ?? '—'}</ThemedText>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            VILLE
          </ThemedText>
          <ThemedView style={styles.row}>
            <ThemedText style={styles.value}>{user?.region ?? '—'}</ThemedText>
            <Link href="/region" style={styles.editLink}>
              <ThemedText type="link" themeColor="primaryStrong">Modifier</ThemedText>
            </Link>
          </ThemedView>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            EMAIL
          </ThemedText>
          <ThemedText style={styles.value}>{user?.email}</ThemedText>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            MOT DE PASSE
          </ThemedText>
          <Link
            href={{ pathname: '/forgot-password', params: { prefilledEmail: user?.email ?? '' } }}
            style={styles.passwordLink}
          >
            <ThemedText type="link" themeColor="primaryStrong">
              Changer le mot de passe
            </ThemedText>
          </Link>

          <Pressable
            onPress={async () => {
              await signOut();
              router.replace('/login');
            }}
            style={styles.logout}
          >
            <ThemedText type="link" themeColor="danger">
              Se déconnecter
            </ThemedText>
          </Pressable>
        </Card>

        <Card style={styles.card}>
          <Link href="/matching" style={styles.menuLink}>
            <ThemedText>🎾 Mes groupes</ThemedText>
          </Link>
          <Link href="/messages" style={styles.menuLink}>
            <ThemedView style={styles.menuLinkRow}>
              <ThemedText>💬 Messages privés</ThemedText>
              <UnreadBadge count={unreadCount} />
            </ThemedView>
          </Link>
          <Link href="/saved-players" style={styles.menuLink}>
            <ThemedText>⭐ Joueurs enregistrés</ThemedText>
          </Link>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  card: { gap: Spacing.two },
  label: { letterSpacing: 0.5, marginTop: Spacing.two },
  value: { fontSize: 16 },
  passwordLink: { marginTop: Spacing.half },
  menuLink: { paddingVertical: Spacing.two },
  menuLinkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: 'transparent' },
  logout: { alignSelf: 'center', marginTop: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: 'transparent' },
  editLink: {},
});
