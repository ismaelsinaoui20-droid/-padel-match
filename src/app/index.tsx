import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

export default function Index() {
  const { isLoading, user } = useAuth();
  const theme = useTheme();

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.primary} size="large" />
      </ThemedView>
    );
  }

  if (!user) {
    return <Redirect href="/welcome" />;
  }

  if (user.isAdmin) {
    return <Redirect href="/admin" />;
  }

  if (!user.region) {
    return <Redirect href="/region" />;
  }

  if (!user.level) {
    return <Redirect href="/profile" />;
  }

  if (!user.availableDates.length) {
    return <Redirect href="/availability" />;
  }

  return <Redirect href="/matching" />;
}
