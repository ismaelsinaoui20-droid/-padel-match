import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import type { Socket } from 'socket.io-client';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { NoTranslate } from '@/components/no-translate';
import { UnreadBadge } from '@/components/unread-badge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, type CourtBookingVote, type MatchGroup, type Message, type TimeVote } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDateLabel } from '@/lib/format-date';
import { mergeMessages } from '@/lib/merge-messages';
import { createChatSocket } from '@/lib/socket';

const TIME_PATTERN = /^([0-1]\d|2[0-3]):([0-5]\d)$/;

function ConfirmedBanner({ group }: { group: MatchGroup }) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Animated.View style={[styles.confirmedBox, { opacity, transform: [{ scale }] }]}>
      <ThemedText style={styles.confirmedEmoji}>{group.courtBooked ? '🎾🔒' : '🎾'}</ThemedText>
      <ThemedText style={[styles.confirmedTitle, { color: theme.primary }]}>
        Match confirmé le {formatDateLabel(group.date)} à {group.confirmedTime}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.confirmedSubtitle}>
        {group.courtBooked
          ? 'La discussion est désormais verrouillée.'
          : "Il ne reste plus qu'à réserver le terrain !"}
      </ThemedText>
    </Animated.View>
  );
}

function TimeProposalBar({
  group,
  currentUserId,
  onPropose,
}: {
  group: MatchGroup;
  currentUserId: string | undefined;
  onPropose: (time: string) => void;
}) {
  const theme = useTheme();
  const [draftTime, setDraftTime] = useState('');
  const [formatError, setFormatError] = useState(false);

  const votesByTime = useMemo(() => {
    const map = new Map<string, TimeVote[]>();
    for (const vote of group.timeVotes) {
      const list = map.get(vote.time) ?? [];
      list.push(vote);
      map.set(vote.time, list);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [group.timeVotes]);

  function submitDraft() {
    if (!TIME_PATTERN.test(draftTime)) {
      setFormatError(true);
      return;
    }
    setFormatError(false);
    onPropose(draftTime);
    setDraftTime('');
  }

  return (
    <ThemedView style={[styles.proposalBox, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.proposalLabel}>
        PROPOSER UN HORAIRE
      </ThemedText>

      {votesByTime.length > 0 && (
        <ThemedView style={styles.chipRow}>
          {votesByTime.map(([time, votes]) => {
            const meIncluded = votes.some((v) => v.userId === currentUserId);
            return (
              <Pressable
                key={time}
                onPress={() => onPropose(time)}
                style={[
                  styles.timeChip,
                  { borderColor: theme.border },
                  meIncluded && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
              >
                <ThemedText
                  type="smallBold"
                  style={{ color: meIncluded ? theme.textOnPrimary : theme.text }}
                >
                  {time} ({votes.length}/{group.members.length})
                </ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>
      )}

      {votesByTime.length > 0 && (
        <ThemedText themeColor="textSecondary" style={styles.hint}>
          Clique sur un horaire pour le confirmer toi aussi.
        </ThemedText>
      )}

      <ThemedView style={styles.proposalRow}>
        <TextInput
          style={[styles.timeInput, { borderColor: theme.border, color: theme.text }]}
          placeholder="ex: 18:30"
          placeholderTextColor={theme.textSecondary}
          value={draftTime}
          onChangeText={setDraftTime}
          onSubmitEditing={submitDraft}
        />
        <PrimaryButton label="Proposer" onPress={submitDraft} style={styles.proposeButton} />
      </ThemedView>
      {formatError && (
        <ThemedText themeColor="danger" style={styles.error}>
          Format attendu : HH:MM (ex: 18:30)
        </ThemedText>
      )}
    </ThemedView>
  );
}

function CourtBookingBar({
  group,
  currentUserId,
  onConfirm,
}: {
  group: MatchGroup;
  currentUserId: string | undefined;
  onConfirm: () => void;
}) {
  const theme = useTheme();
  const meConfirmed = group.courtBookingVotes.some((v) => v.userId === currentUserId);

  return (
    <ThemedView style={[styles.proposalBox, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.proposalLabel}>
        TERRAIN RÉSERVÉ ?
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.hint}>
        {group.courtBookingVotes.length}/{group.members.length} joueurs confirment avoir réservé le terrain.
      </ThemedText>
      <PrimaryButton
        label={meConfirmed ? '✓ Réservation confirmée' : 'Le terrain est réservé'}
        onPress={onConfirm}
        disabled={meConfirmed}
        variant={meConfirmed ? 'outline' : 'solid'}
      />
    </ThemedView>
  );
}

function PlayerMenu({
  token,
  player,
  onClose,
}: {
  token: string | null;
  player: { id: string; name: string; isAdmin?: boolean };
  onClose: () => void;
}) {
  const theme = useTheme();
  const [view, setView] = useState<'menu' | 'report' | 'feedback'>('menu');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);

  async function handleSave() {
    if (!token) return;
    await api.savePlayer(token, player.id);
    setFeedback('✅ Joueur enregistré');
    setView('feedback');
    setTimeout(onClose, 700);
  }

  async function handleSubmitReport() {
    if (!token) return;
    if (!reason.trim()) {
      setReportError('Indique la raison du signalement.');
      return;
    }
    await api.reportPlayer(token, player.id, reason.trim());
    setFeedback('🚩 Joueur signalé');
    setView('feedback');
    setTimeout(onClose, 700);
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <Pressable
          style={[styles.menuCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          onPress={() => {}}
        >
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.menuTitle}>
            <NoTranslate>{player.name}</NoTranslate>
          </ThemedText>

          {view === 'menu' && (
            <>
              <Pressable style={styles.menuItem} onPress={handleSave}>
                <ThemedText>⭐ Enregistrer le joueur</ThemedText>
              </Pressable>
              {!player.isAdmin && (
                <Pressable style={styles.menuItem} onPress={() => setView('report')}>
                  <ThemedText themeColor="danger">🚩 Signaler le joueur</ThemedText>
                </Pressable>
              )}
            </>
          )}

          {view === 'report' && (
            <ThemedView style={styles.reportForm}>
              <ThemedText themeColor="textSecondary" style={styles.reportLabel}>
                Pourquoi signales-tu <NoTranslate>{player.name}</NoTranslate> ?
              </ThemedText>
              <TextInput
                style={[styles.reportInput, { borderColor: theme.border, color: theme.text }]}
                placeholder="Décris le problème..."
                placeholderTextColor={theme.textSecondary}
                value={reason}
                onChangeText={(text) => {
                  setReason(text);
                  setReportError(null);
                }}
                multiline
                numberOfLines={3}
              />
              {reportError && <ThemedText themeColor="danger">{reportError}</ThemedText>}
              <PrimaryButton label="Envoyer le signalement" onPress={handleSubmitReport} />
            </ThemedView>
          )}

          {view === 'feedback' && feedback && <ThemedText style={styles.menuFeedback}>{feedback}</ThemedText>}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ChatScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { token, user } = useAuth();
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [group, setGroup] = useState<MatchGroup | null>(null);
  const [draft, setDraft] = useState('');
  const [menuPlayer, setMenuPlayer] = useState<{ id: string; name: string; isAdmin?: boolean } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;
    const fetchUnread = () => api.getUnreadDmCount(token).then((res) => setUnreadCount(res.count));
    fetchUnread();
    const interval = setInterval(fetchUnread, 4000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!token || !groupId) return;

    api.getMessages(token, groupId).then((res) => {
      setMessages((prev) => mergeMessages(prev, res.messages));
    });
    api.getMatchStatus(token).then((res) => setGroup(res.groups.find((g) => g.id === groupId) ?? null));

    const socket = createChatSocket(token);
    socketRef.current = socket;
    socket.emit('join_group', groupId);
    socket.on('new_message', (message: Message) => {
      setMessages((prev) => mergeMessages(prev, [message]));
    });
    socket.on('time_votes_updated', ({ votes }: { groupId: string; votes: TimeVote[] }) => {
      setGroup((prev) => (prev ? { ...prev, timeVotes: votes } : prev));
    });
    socket.on('match_confirmed', ({ time }: { groupId: string; time: string }) => {
      setGroup((prev) => (prev ? { ...prev, status: 'CONFIRMED', confirmedTime: time } : prev));
    });
    socket.on('court_votes_updated', ({ votes }: { groupId: string; votes: CourtBookingVote[] }) => {
      setGroup((prev) => (prev ? { ...prev, courtBookingVotes: votes } : prev));
    });
    socket.on('court_booked_confirmed', () => {
      setGroup((prev) => (prev ? { ...prev, courtBooked: true } : prev));
    });

    return () => {
      socket.disconnect();
    };
  }, [token, groupId]);

  function handleSend() {
    if (!draft.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { groupId, content: draft.trim() });
    setDraft('');
  }

  function handlePropose(time: string) {
    socketRef.current?.emit('propose_time', { groupId, time });
  }

  function handleConfirmCourtBooked() {
    socketRef.current?.emit('confirm_court_booked', { groupId });
  }

  const isTimeConfirmed = group?.status === 'CONFIRMED';
  const isLocked = isTimeConfirmed && group?.courtBooked;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ThemedView style={styles.container}>
        {group && (
          <ThemedView style={[styles.dayBanner, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              Date confirmée : {formatDateLabel(group.date)}
            </ThemedText>
            <ThemedView style={styles.dayBannerLinks}>
              <Link href="/account">
                <ThemedView style={styles.dayBannerLinkRow}>
                  <ThemedText type="link" themeColor="textSecondary">
                    Mon compte
                  </ThemedText>
                  <UnreadBadge count={unreadCount} />
                </ThemedView>
              </Link>
              <Link href="/matching">
                <ThemedText type="link" themeColor="textSecondary">
                  Mes groupes
                </ThemedText>
              </Link>
            </ThemedView>
          </ThemedView>
        )}

        {isTimeConfirmed && group && <ConfirmedBanner group={group} />}

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (!item.user) {
              return (
                <ThemedView style={styles.messageRow}>
                  <ThemedView style={[styles.systemBubble, { borderColor: theme.primary }]}>
                    <ThemedText type="smallBold" style={[styles.systemAuthor, { color: theme.primary }]}>
                      🎾 <NoTranslate>Padel Match</NoTranslate>
                    </ThemedText>
                    <ThemedText style={{ color: theme.text }}>{item.content}</ThemedText>
                  </ThemedView>
                </ThemedView>
              );
            }

            const isMe = item.userId === user?.id;
            const isAdminMessage = item.user.isAdmin;
            return (
              <ThemedView style={[styles.messageRow, isMe && styles.messageRowMe]}>
                <ThemedView
                  style={[
                    styles.bubble,
                    isAdminMessage
                      ? { backgroundColor: theme.backgroundElement, borderColor: theme.primary, borderWidth: 1.5, borderTopLeftRadius: 4 }
                      : isMe
                        ? { backgroundColor: theme.primary, borderTopRightRadius: 4 }
                        : { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1, borderTopLeftRadius: 4 },
                  ]}
                >
                  {(!isMe || isAdminMessage) && (
                    <ThemedView style={styles.authorRow}>
                      <ThemedText
                        type="smallBold"
                        themeColor={isAdminMessage ? undefined : 'textSecondary'}
                        style={[styles.author, isAdminMessage && { color: theme.primary }]}
                      >
                        {isAdminMessage ? '🎾 ' : ''}
                        <NoTranslate>{item.user.name}</NoTranslate>
                      </ThemedText>
                      <Pressable
                        onPress={() => setMenuPlayer({ id: item.user!.id, name: item.user!.name, isAdmin: isAdminMessage })}
                        style={styles.menuButton}
                      >
                        <ThemedText themeColor="textSecondary" style={styles.menuButtonText}>
                          •••
                        </ThemedText>
                      </Pressable>
                    </ThemedView>
                  )}
                  <ThemedText style={{ color: isMe && !isAdminMessage ? theme.textOnPrimary : theme.text }}>
                    {item.content}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            );
          }}
        />

        {!isTimeConfirmed && group && (
          <TimeProposalBar group={group} currentUserId={user?.id} onPropose={handlePropose} />
        )}

        {isTimeConfirmed && !group?.courtBooked && group && (
          <CourtBookingBar group={group} currentUserId={user?.id} onConfirm={handleConfirmCourtBooked} />
        )}

        {isLocked ? (
          <ThemedView style={[styles.lockedRow, { borderTopColor: theme.border }]}>
            <ThemedText themeColor="textSecondary" style={styles.lockedText}>
              🔒 Chat verrouillé — horaire décidé et terrain réservé
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={[styles.inputRow, { borderTopColor: theme.border }]}>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }]}
              placeholder="Écris un message..."
              placeholderTextColor={theme.textSecondary}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={handleSend}
            />
            <Pressable
              onPress={handleSend}
              style={[styles.sendButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText type="smallBold" style={{ color: theme.textOnPrimary }}>
                Envoyer
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}
      </ThemedView>

      {menuPlayer && (
        <PlayerMenu token={token} player={menuPlayer} onClose={() => setMenuPlayer(null)} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dayBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  dayBannerLinks: { flexDirection: 'row', gap: Spacing.three },
  dayBannerLinkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, backgroundColor: 'transparent' },
  list: { padding: Spacing.three, gap: Spacing.two },
  messageRow: { alignItems: 'flex-start' },
  messageRowMe: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: 2 },
  author: { fontSize: 12 },
  menuButton: { paddingHorizontal: Spacing.one },
  menuButtonText: { fontSize: 14, fontWeight: '800' },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCard: {
    width: 260,
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  menuTitle: { marginBottom: Spacing.one },
  menuItem: { paddingVertical: Spacing.two },
  menuFeedback: { textAlign: 'center', paddingVertical: Spacing.two, fontSize: 15 },
  reportForm: { gap: Spacing.two },
  reportLabel: { fontSize: 13 },
  reportInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: Spacing.three,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  systemBubble: {
    maxWidth: '85%',
    borderRadius: 18,
    borderWidth: 1.5,
    borderTopLeftRadius: 4,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  systemAuthor: { marginBottom: 2, fontSize: 12 },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  sendButton: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  proposalBox: {
    padding: Spacing.three,
    borderTopWidth: 1,
    gap: Spacing.two,
  },
  proposalLabel: { letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  timeChip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  proposalRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  timeInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  proposeButton: { paddingHorizontal: Spacing.four },
  hint: { fontSize: 12 },
  error: { fontSize: 13 },
  lockedRow: {
    padding: Spacing.three,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  lockedText: { fontSize: 14 },
  confirmedBox: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  confirmedEmoji: { fontSize: 36 },
  confirmedTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  confirmedSubtitle: { fontSize: 14 },
});
