import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function AdminScreen() {
  const { signOut } = useAuth();

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
        </Card>
      </ThemedView>
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
});
