import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export function UnreadBadge({ count }: { count: number }) {
  const theme = useTheme();
  if (count <= 0) return null;

  return (
    <ThemedView style={[styles.badge, { backgroundColor: theme.danger }]}>
      <ThemedText type="smallBold" style={styles.text}>
        {count > 99 ? '99+' : count}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 11, color: '#fff', lineHeight: 14 },
});
