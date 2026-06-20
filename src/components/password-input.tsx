import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function PasswordInput({ style, ...rest }: TextInputProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text }, style]}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={!visible}
        {...rest}
      />
      <Pressable onPress={() => setVisible((v) => !v)} style={styles.toggle}>
        <ThemedText type="smallBold" themeColor="primaryStrong">
          {visible ? 'Cacher' : 'Voir'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: Spacing.three,
    paddingRight: 64,
    fontSize: 16,
  },
  toggle: {
    position: 'absolute',
    right: Spacing.three,
  },
});
