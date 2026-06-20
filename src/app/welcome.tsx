import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function WelcomeScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.hero}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText type="title" style={styles.title}>
            BIENVENUE SUR <ThemedText type="title" style={[styles.title, { color: theme.primary }]}>PADEL MATCH</ThemedText> !
          </ThemedText>
        </ThemedView>

        <ThemedText type="smallBold" style={[styles.duoHint, { color: theme.primary }]}>
          👥 Tu veux jouer avec un ami ? Inscrivez-vous chacun, puis retrouvez-vous en binôme !
        </ThemedText>

        <ThemedView style={styles.actions}>
          <PrimaryButton label="S'inscrire" onPress={() => router.push('/register')} />
          <PrimaryButton
            label="Se connecter"
            variant="outline"
            onPress={() => router.push('/login')}
          />
          <PrimaryButton
            label="Administration"
            variant="outline"
            onPress={() => router.push('/admin-login')}
          />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.six,
    paddingHorizontal: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: Spacing.three },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 32,
  },
  title: { textAlign: 'center', fontSize: 32, lineHeight: 38 },
  duoHint: { textAlign: 'center', fontSize: 15, lineHeight: 21 },
  actions: { gap: Spacing.three },
});
