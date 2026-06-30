import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { COUNTRIES } from '@/constants/countries';
import { citiesForCountry } from '@/constants/cities';
import { TUNISIA_GOVERNORATES } from '@/constants/regions';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Step = 'country' | 'city' | 'confirm';

export default function RegionScreen() {
  const { token, user, refreshUser } = useAuth();
  const theme = useTheme();
  const [step, setStep] = useState<Step>('country');
  const [filter, setFilter] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [age, setAge] = useState(user?.age != null ? String(user.age) : '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const region = city;

  const filteredCountries = COUNTRIES.filter((c) => c.toLowerCase().includes(filter.trim().toLowerCase()));
  const cities = useMemo(() => {
    if (!country) return [];
    return country === 'Tunisie' ? TUNISIA_GOVERNORATES : citiesForCountry(country);
  }, [country]);

  function selectCountry(value: string) {
    setCountry(value);
    setFilter('');
    setStep('city');
  }

  function selectCity(value: string) {
    setCity(value);
    setStep('confirm');
  }

  function goBack() {
    if (step === 'confirm') {
      setStep('city');
      setCity(null);
    } else {
      setStep('country');
      setCountry(null);
      setCity(null);
    }
  }

  async function handleSubmit() {
    if (!token || !region) return;
    const ageNumber = Number(age);
    if (!age || !Number.isInteger(ageNumber) || ageNumber < 0 || ageNumber > 120) {
      setError('Renseigne un âge valide');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await api.updateProfile(token, { region, age: ageNumber });
      await refreshUser();
      router.replace('/profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mise à jour impossible');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Ta région
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Sélectionne ton pays puis ta ville pour qu'on te propose des partenaires près de toi.
        </ThemedText>

        {step === 'country' && (
          <>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              placeholder="Filtrer la liste des pays..."
              placeholderTextColor={theme.textSecondary}
              value={filter}
              onChangeText={setFilter}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => selectCountry(item)}
                  style={[styles.option, { borderColor: theme.border }]}
                >
                  <ThemedText>{item}</ThemedText>
                </Pressable>
              )}
            />
          </>
        )}

        {step === 'city' && (
          <>
            <Pressable onPress={goBack} style={styles.backLink}>
              <ThemedText type="link" themeColor="textSecondary">
                ← Changer de pays
              </ThemedText>
            </Pressable>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
              VILLE ({country})
            </ThemedText>
            <FlatList
              data={cities}
              keyExtractor={(item) => item}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => selectCity(item)}
                  style={[styles.option, { borderColor: theme.border }]}
                >
                  <ThemedText>{item}</ThemedText>
                </Pressable>
              )}
            />
          </>
        )}

        {step === 'confirm' && (
          <Card style={styles.card}>
            <Pressable onPress={goBack} style={styles.backLink}>
              <ThemedText type="link" themeColor="textSecondary">
                ← Modifier la ville
              </ThemedText>
            </Pressable>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
              VILLE SÉLECTIONNÉE
            </ThemedText>
            <ThemedText type="subtitle" style={{ color: theme.primary }}>
              {region}, {country}
            </ThemedText>

            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
              ÂGE
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              placeholder="Ton âge"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
            />

            {error && (
              <ThemedText themeColor="danger" style={styles.error}>
                {error}
              </ThemedText>
            )}

            <PrimaryButton
              label={isSubmitting ? 'Enregistrement...' : 'Continuer'}
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submit}
            />
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
  card: { gap: Spacing.two },
  label: { letterSpacing: 0.5, marginTop: Spacing.two },
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
  },
  backLink: { marginBottom: Spacing.one },
  error: { fontSize: 14 },
  submit: { marginTop: Spacing.two },
});
