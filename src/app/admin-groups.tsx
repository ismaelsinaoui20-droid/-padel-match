import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { Card } from '@/components/card';
import { NoTranslate } from '@/components/no-translate';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, type MatchGroup } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDateLabel } from '@/lib/format-date';

function AddPlayerModal({
  token,
  groupId,
  onClose,
  onAdded,
}: {
  token: string;
  groupId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const theme = useTheme();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (mode === 'register' && (!name || !email || !password)) {
      setError('Nom, email et mot de passe sont requis.');
      return;
    }
    if (mode === 'login' && (!email || !password)) {
      setError('Email et mot de passe sont requis.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data =
        mode === 'register'
          ? { mode: 'register' as const, name, email, password }
          : { mode: 'login' as const, email, password };
      const res = await api.addPlayerToGroup(token, groupId, data);
      setFeedback(`✅ ${res.player.name} a été ajouté au groupe`);
      onAdded();
      setTimeout(onClose, 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible d’ajouter ce joueur');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          onPress={() => {}}
        >
          <ThemedText type="subtitle" style={styles.modalTitle}>
            Ajouter un joueur
          </ThemedText>

          {feedback ? (
            <ThemedText style={styles.feedback}>{feedback}</ThemedText>
          ) : (
            <>
              <ThemedView style={styles.tabRow}>
                <Pressable
                  style={[
                    styles.tab,
                    { borderColor: theme.border },
                    mode === 'register' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setMode('register')}
                >
                  <ThemedText style={{ color: mode === 'register' ? theme.textOnPrimary : theme.text }}>
                    S'inscrire
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.tab,
                    { borderColor: theme.border },
                    mode === 'login' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setMode('login')}
                >
                  <ThemedText style={{ color: mode === 'login' ? theme.textOnPrimary : theme.text }}>
                    Se connecter
                  </ThemedText>
                </Pressable>
              </ThemedView>

              {mode === 'register' && (
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Nom du joueur"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                />
              )}
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="Email"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="Mot de passe"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              {error && (
                <ThemedText themeColor="danger" style={styles.error}>
                  {error}
                </ThemedText>
              )}

              <PrimaryButton
                label={isSubmitting ? 'Ajout...' : 'Ajouter au groupe'}
                onPress={handleSubmit}
                disabled={isSubmitting}
              />
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AdminGroupCard({ group, token, onRefresh }: { group: MatchGroup; token: string; onRefresh: () => void }) {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const isFull = group.members.length >= 4;

  return (
    <Card style={styles.groupCard}>
      <ThemedView style={styles.groupHeader}>
        <ThemedText type="subtitle">{formatDateLabel(group.date)}</ThemedText>
        <ThemedText themeColor="textSecondary">{group.level}</ThemedText>
      </ThemedView>
      <ThemedText themeColor="textSecondary" style={styles.groupStatus}>
        Statut : {group.status}
        {group.confirmedTime ? ` — ${group.confirmedTime}` : ''}
        {group.courtBooked ? ' — terrain réservé' : ''}
      </ThemedText>
      <ThemedView style={styles.memberList}>
        {group.members.map((m) => (
          <ThemedText key={m.id} themeColor="textSecondary" style={styles.memberName}>
            • <NoTranslate>{m.user.name}</NoTranslate>
          </ThemedText>
        ))}
        {group.members.length === 0 && (
          <ThemedText themeColor="textSecondary" style={styles.memberName}>
            Aucun joueur encore
          </ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.groupActions}>
        <PrimaryButton
          label={isFull ? '➕ Groupe complet' : '➕ Ajouter un joueur'}
          variant="outline"
          onPress={() => setShowAddPlayer(true)}
          disabled={isFull}
        />
        <PrimaryButton label="💬 Voir le chat" onPress={() => router.push(`/chat/${group.id}`)} />
      </ThemedView>

      {showAddPlayer && !isFull && (
        <AddPlayerModal
          token={token}
          groupId={group.id}
          onClose={() => setShowAddPlayer(false)}
          onAdded={onRefresh}
        />
      )}
    </Card>
  );
}

export default function AdminGroupsScreen() {
  const { token } = useAuth();
  const theme = useTheme();
  const [groups, setGroups] = useState<MatchGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) return;
    const res = await api.getAdminGroups(token);
    setGroups(res.groups);
    setIsLoading(false);
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (isLoading || !token) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.primary} size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.sectionTitle}>
          Tous les groupes ({groups.length})
        </ThemedText>
        {groups.map((group) => (
          <AdminGroupCard key={group.id} group={group} token={token} onRefresh={refresh} />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
  groupCard: { gap: Spacing.two },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  groupStatus: { fontSize: 13 },
  memberList: { gap: Spacing.half, backgroundColor: 'transparent' },
  memberName: { fontSize: 14 },
  groupActions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one, backgroundColor: 'transparent' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: 300,
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  modalTitle: { fontSize: 20, marginBottom: Spacing.one },
  tabRow: { flexDirection: 'row', gap: Spacing.two, backgroundColor: 'transparent' },
  tab: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: Spacing.three,
    fontSize: 15,
  },
  error: { fontSize: 13 },
  feedback: { textAlign: 'center', fontSize: 15, paddingVertical: Spacing.two },
});
