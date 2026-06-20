import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput } from 'react-native';
import type { Socket } from 'socket.io-client';

import { NoTranslate } from '@/components/no-translate';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, type DirectMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { createChatSocket } from '@/lib/socket';
import { mergeMessages } from '@/lib/merge-messages';

export default function DirectChatScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();
  const { token, user } = useAuth();
  const theme = useTheme();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState('');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !userId) return;

    api.getDirectMessages(token, userId).then((res) => {
      setMessages((prev) => mergeMessages(prev, res.messages));
    });

    const socket = createChatSocket(token);
    socketRef.current = socket;
    socket.emit('join_dm', { withUserId: userId });
    socket.on('new_dm', (message: DirectMessage) => {
      setMessages((prev) => mergeMessages(prev, [message]));
    });

    return () => {
      socket.disconnect();
    };
  }, [token, userId]);

  function handleSend() {
    if (!draft.trim() || !socketRef.current) return;
    socketRef.current.emit('send_dm', { withUserId: userId, content: draft.trim() });
    setDraft('');
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={styles.container}>
        <ThemedView style={[styles.header, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
          <ThemedText type="smallBold">{name ? <NoTranslate>{name}</NoTranslate> : 'Discussion privée'}</ThemedText>
        </ThemedView>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isMe = item.senderId === user?.id;
            return (
              <ThemedView style={[styles.messageRow, isMe && styles.messageRowMe]}>
                <ThemedView
                  style={[
                    styles.bubble,
                    isMe
                      ? { backgroundColor: theme.primary, borderTopRightRadius: 4 }
                      : { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1, borderTopLeftRadius: 4 },
                  ]}
                >
                  <ThemedText style={{ color: isMe ? theme.textOnPrimary : theme.text }}>
                    {item.content}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            );
          }}
        />

        <ThemedView style={[styles.inputRow, { borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder="Écris un message..."
            placeholderTextColor={theme.textSecondary}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={handleSend}
          />
          <Pressable onPress={handleSend} style={[styles.sendButton, { backgroundColor: theme.primary }]}>
            <ThemedText type="smallBold" style={{ color: theme.textOnPrimary }}>
              Envoyer
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.three, borderBottomWidth: 1, alignItems: 'center' },
  list: { padding: Spacing.three, gap: Spacing.two },
  messageRow: { alignItems: 'flex-start' },
  messageRowMe: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
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
});
