import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'solid' | 'outline';
};

export function PrimaryButton({ label, onPress, disabled, style, variant = 'solid' }: PrimaryButtonProps) {
  const theme = useTheme();
  const isOutline = variant === 'outline';

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        styles.button,
        isOutline
          ? { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.primary }
          : { backgroundColor: theme.primary },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <ThemedText
        type="smallBold"
        style={[styles.label, { color: isOutline ? theme.primaryStrong : theme.textOnPrimary }]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
