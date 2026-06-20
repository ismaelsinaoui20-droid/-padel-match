import { DarkTheme, Stack, ThemeProvider } from 'expo-router';

import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout() {
  const theme = Colors.dark;

  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.backgroundElement,
      border: theme.border,
      text: theme.text,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: theme.backgroundElement },
            headerTintColor: theme.text,
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="admin-login" />
          <Stack.Screen name="forgot-password" options={{ headerShown: true, title: 'Mot de passe oublié' }} />
          <Stack.Screen name="reset-password" options={{ headerShown: true, title: 'Réinitialisation' }} />
          <Stack.Screen name="region" options={{ headerShown: true, title: 'Ta région' }} />
          <Stack.Screen name="profile" options={{ headerShown: true, title: 'Mon profil' }} />
          <Stack.Screen name="account" options={{ headerShown: true, title: 'Mon compte' }} />
          <Stack.Screen name="admin" options={{ headerShown: true, title: 'Administration' }} />
          <Stack.Screen name="admin-groups" options={{ headerShown: true, title: 'Tous les groupes' }} />
          <Stack.Screen name="admin-players" options={{ headerShown: true, title: 'Tous les joueurs' }} />
          <Stack.Screen name="availability" options={{ headerShown: true, title: 'Disponibilités' }} />
          <Stack.Screen name="duo" options={{ headerShown: true, title: 'Binôme' }} />
          <Stack.Screen name="matching" options={{ headerShown: true, title: 'Recherche de partenaires' }} />
          <Stack.Screen name="chat/[groupId]" options={{ headerShown: true, title: 'Groupe' }} />
          <Stack.Screen name="saved-players" options={{ headerShown: true, title: 'Joueurs enregistrés' }} />
          <Stack.Screen name="messages" options={{ headerShown: true, title: 'Messages privés' }} />
          <Stack.Screen name="dm/[userId]" options={{ headerShown: true, title: 'Discussion privée' }} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
