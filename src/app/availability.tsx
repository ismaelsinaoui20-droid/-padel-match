import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, type CycleDate } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function AvailabilityScreen() {
  const { token, user, refreshUser } = useAuth();
  const theme = useTheme();
  const [cycleDates, setCycleDates] = useState<CycleDate[]>([]);
  const [isLoadingCycle, setIsLoadingCycle] = useState(true);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.getCycle(token).then((res) => {
      setCycleDates(res.dates);
      const validDates = res.dates.map((d) => d.date);
      setAvailableDates((user?.availableDates ?? []).filter((d) => validDates.includes(d)));
      setIsLoadingCycle(false);
    });
  }, [token]);

  async function handleSubmit() {
    if (!token) return;
    if (availableDates.length === 0) {
      setError('Choisis au moins une date de disponibilité');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await api.updateProfile(token, { availableDates });
      await refreshUser();
      await api.findMatch(token);
      router.replace('/matching');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mise à jour impossible');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Tes disponibilités
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Choisis tes dates pour les 2 prochaines semaines. Tout est réinitialisé au début de chaque
          nouveau cycle de 2 semaines.
        </ThemedText>

        <Card style={styles.card}>
          {isLoadingCycle ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <ThemedView style={styles.dayList}>
              {cycleDates.map(({ date, label }) => {
                const selected = availableDates.includes(date);
                return (
                  <Pressable
                    key={date}
                    onPress={() => setAvailableDates((prev) => toggle(prev, date))}
                    style={[
                      styles.dayRow,
                      { borderColor: theme.border },
                      selected && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                  >
                    <ThemedText
                      type="smallBold"
                      style={{ color: selected ? theme.textOnPrimary : theme.text }}
                    >
                      {label}
                    </ThemedText>
                    <ThemedView
                      style={[
                        styles.checkbox,
                        { borderColor: selected ? theme.textOnPrimary : theme.border },
                        selected && { backgroundColor: theme.textOnPrimary },
                      ]}
                    >
                      {selected && (
                        <ThemedText style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>
                          ✓
                        </ThemedText>
                      )}
                    </ThemedView>
                  </Pressable>
                );
              })}
            </ThemedView>
          )}

          {error && (
            <ThemedText themeColor="danger" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <PrimaryButton
            label={isSubmitting ? 'Enregistrement...' : 'Trouver des partenaires'}
            onPress={handleSubmit}
            disabled={isSubmitting || isLoadingCycle}
            style={styles.submit}
          />
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
  title: { fontSize: 30, lineHeight: 36 },
  subtitle: { fontSize: 15, marginBottom: Spacing.one },
  card: { gap: Spacing.two },
  dayList: { gap: Spacing.two },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { fontSize: 14 },
  submit: { marginTop: Spacing.two },
});
