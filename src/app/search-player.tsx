import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const REPORT_REASONS = [
  'Comportement inapproprié',
  'Langage abusif',
  'No-show (absent sans prévenir)',
  'Fausse identité / faux niveau',
  'Autre',
];

export default function SearchPlayerScreen() {
  const { token } = useAuth();
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Player | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [customReason, setCustomReason] = useState('');
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
    setFeedback(null);
  }

  async function handleSave() {
    if (!token || !selected) return;
    setIsSubmitting(true);
    try {
      await api.savePlayer(token, selected.id);
      setFeedback(`✅ ${selected.name} enregistré !`);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Impossible d\'enregistrer');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReport(reason: string) {
    if (!token || !selected) return;
    const finalReason = reason === 'Autre' ? customReason.trim() : reason;
    if (!finalReason) return;
    setIsSubmitting(true);
    try {
      await api.reportPlayer(token, selected.id, finalReason);
      setShowReport(false);
      setFeedback(`🚨 ${selected.name} signalé.`);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Impossible de signaler');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Rechercher un joueur
          </ThemedText>

          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="Nom du joueur..."
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setSelected(null);
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
                  <ThemedText><NoTranslate>{item.name}</NoTranslate></ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.optionDetail}>
                    {item.level ?? 'Niveau non défini'} · {item.region ?? 'Région non définie'}
                  </ThemedText>
                </Pressable>
              )}
            />
          )}

          {selected && (
            <Card style={styles.card}>
              <ThemedText type="subtitle" style={{ color: theme.primary }}>
                <NoTranslate>{selected.name}</NoTranslate>
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.optionDetail}>
                {selected.level ?? 'Niveau non défini'} · {selected.region ?? 'Région non définie'}
              </ThemedText>

              {feedback ? (
                <ThemedText style={styles.feedback}>{feedback}</ThemedText>
              ) : (
                <>
                  <PrimaryButton
                    label={isSubmitting ? '...' : '⭐ Enregistrer'}
                    onPress={handleSave}
                    disabled={isSubmitting}
                  />
                  <PrimaryButton
                    label="🚨 Signaler"
                    variant="outline"
                    onPress={() => setShowReport(true)}
                    disabled={isSubmitting}
                    style={styles.reportBtn}
                  />
                </>
              )}
            </Card>
          )}
        </ThemedView>
      </SafeAreaView>

      <Modal visible={showReport} transparent animationType="slide" onRequestClose={() => setShowReport(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowReport(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.background }]} onPress={() => {}}>
            <ThemedText type="subtitle" style={styles.sheetTitle}>
              Motif du signalement
            </ThemedText>
            {REPORT_REASONS.map((reason) => (
              <Pressable
                key={reason}
                style={[styles.reasonOption, { borderColor: theme.border }]}
                onPress={() => {
                  if (reason !== 'Autre') handleReport(reason);
                }}
              >
                <ThemedText>{reason}</ThemedText>
              </Pressable>
            ))}
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, marginTop: Spacing.two }]}
              placeholder="Autre motif..."
              placeholderTextColor={theme.textSecondary}
              value={customReason}
              onChangeText={setCustomReason}
            />
            {customReason.trim().length > 0 && (
              <PrimaryButton
                label="Envoyer"
                onPress={() => handleReport('Autre')}
                disabled={isSubmitting}
                style={{ marginTop: Spacing.two }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  title: { fontSize: 28, lineHeight: 34 },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: Spacing.three,
    fontSize: 16,
  },
  list: { flexGrow: 0 },
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
  feedback: { textAlign: 'center', fontSize: 15, paddingVertical: Spacing.two },
  reportBtn: { marginTop: Spacing.one },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  sheetTitle: { fontSize: 18, marginBottom: Spacing.one },
  reasonOption: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: 1.5,
  },
});
