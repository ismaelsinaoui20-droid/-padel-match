import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';

import { Card } from '@/components/card';
import { NoTranslate } from '@/components/no-translate';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, type User } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Player = Pick<User, 'id' | 'name' | 'level' | 'region'>;

export default function DuoScreen() {
  const { token } = useAuth();
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !query.trim() || selected) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      api.searchPlayers(token, query.trim()).then((res) => setResults(res.players));
    }, 250);
    return () => clearTimeout(timeout);
  }, [token, query, selected]);

  function selectPlayer(player: Player) {
    setSelected(player);
    setQuery(player.name);
    setResults([]);
  }

  async function handleSubmit() {
    if (!token || !selected) return;
    setError(null);
    setFeedback(null);
    setIsSubmitting(true);
    try {
      await api.findDuoMatch(token, selected.id);
      setFeedback(`✅ Inscription en binôme avec ${selected.name} réussie !`);
      setTimeout(() => router.replace('/matching'), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inscription en binôme impossible');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          S'inscrire en binôme
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Cherche ton binôme par son nom. Vous devez avoir le même niveau et la même région.
        </ThemedText>

        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          placeholder="Nom de ton binôme..."
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setSelected(null);
            setError(null);
            setFeedback(null);
          }}
        />

        {!selected && results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => selectPlayer(item)}
                style={[styles.option, { borderColor: theme.border }]}
              >
                <ThemedText>
                  <NoTranslate>{item.name}</NoTranslate>
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.optionDetail}>
                  {item.level ?? 'Niveau non défini'} · {item.region ?? 'Région non définie'}
                </ThemedText>
              </Pressable>
            )}
          />
        )}

        {selected && (
          <Card style={styles.card}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
              BINÔME SÉLECTIONNÉ
            </ThemedText>
            <ThemedText type="subtitle" style={{ color: theme.primary }}>
              <NoTranslate>{selected.name}</NoTranslate>
            </ThemedText>

            {feedback ? (
              <ThemedText style={styles.feedback}>{feedback}</ThemedText>
            ) : (
              <>
                {error && (
                  <ThemedText themeColor="danger" style={styles.error}>
                    {error}
                  </ThemedText>
                )}
                <PrimaryButton
                  label={isSubmitting ? 'Inscription...' : "S'inscrire en binôme"}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={styles.submit}
                />
              </>
            )}
          </Card>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  title: { fontSize: 30, lineHeight: 36 },
  subtitle: { fontSize: 15, marginBottom: Spacing.one },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: Spacing.three,
    fontSize: 16,
  },
  list: { flex: 1 },
  option: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: Spacing.one,
    gap: Spacing.half,
  },
  optionDetail: { fontSize: 12 },
  card: { gap: Spacing.two },
  label: { letterSpacing: 0.5 },
  feedback: { textAlign: 'center', fontSize: 15, paddingVertical: Spacing.two },
  error: { fontSize: 14 },
  submit: { marginTop: Spacing.one },
});
