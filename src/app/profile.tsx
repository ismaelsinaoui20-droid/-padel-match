import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, type Level } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Question = {
  text: string;
  group: 'fundamentals' | 'advanced';
  options: { label: string; points: number }[];
};

// Fundamentals = service, coups de base, jeu au filet, défense, placement (max 40 pts).
// Un joueur qui maîtrise tout ça mais n'a aucun coup d'attaque/expérience plafonne en P100.
const QUESTIONS: Question[] = [
  {
    text: 'Ton service est-il fiable ?',
    group: 'fundamentals',
    options: [
      { label: 'Je rate très souvent, même au service simple', points: 0 },
      { label: 'Je rate encore parfois', points: 2 },
      { label: 'Il passe la plupart du temps', points: 4 },
      { label: 'Il passe presque toujours et je le place bien', points: 6 },
      { label: 'Toujours fiable, je varie placement et effet', points: 8 },
    ],
  },
  {
    text: 'Sais-tu jouer un coup droit et un revers avec contrôle, pas juste taper fort ?',
    group: 'fundamentals',
    options: [
      { label: 'Non, je tape sans vraiment contrôler', points: 0 },
      { label: 'Je contrôle un peu mais pas toujours', points: 2 },
      { label: 'Je contrôle bien la direction la plupart du temps', points: 4 },
      { label: 'Je contrôle direction et profondeur', points: 6 },
      { label: 'Je varie aussi puissance, effet et profondeur à volonté', points: 8 },
    ],
  },
  {
    text: 'Es-tu à l\'aise au filet, à la volée et au smash, pour terminer un point ?',
    group: 'fundamentals',
    options: [
      { label: 'Je galère, je rate beaucoup', points: 0 },
      { label: 'Je m\'en sors un peu mais pas régulièrement', points: 2 },
      { label: 'Je suis assez solide la plupart du temps', points: 4 },
      { label: 'Solide et je varie les angles/placements', points: 6 },
      { label: 'Très solide, je ferme souvent le point', points: 8 },
    ],
  },
  {
    text: 'Quand tu es repoussé au fond ou lobé, sais-tu défendre efficacement (lob défensif, remise de vitre) ?',
    group: 'fundamentals',
    options: [
      { label: 'Je galère, je rate beaucoup ces situations', points: 0 },
      { label: 'Je m\'en sors avec difficulté', points: 2 },
      { label: 'Je m\'en sors bien la plupart du temps', points: 4 },
      { label: 'Je défends bien et je remets toujours avec contrôle', points: 6 },
      { label: 'Je défends très bien, c\'est rarement un problème pour moi', points: 8 },
    ],
  },
  {
    text: 'Sais-tu te placer correctement (filet/fond) et lire le jeu pour anticiper la balle adverse ?',
    group: 'fundamentals',
    options: [
      { label: 'Je ne sais pas trop où me mettre, je suis souvent surpris', points: 0 },
      { label: 'À peu près, mais souvent en retard', points: 2 },
      { label: 'Je me place bien et j\'anticipe parfois', points: 4 },
      { label: 'Je me place bien, j\'anticipe et je communique avec mon partenaire', points: 6 },
      { label: 'Je couvre aussi les espaces de mon partenaire en anticipant le jeu', points: 8 },
    ],
  },
  {
    text: "Connais-tu et utilises-tu la bandeja (coup d'attaque après une balle haute) ?",
    group: 'advanced',
    options: [
      { label: 'Je ne sais pas ce que c\'est', points: 0 },
      { label: "J'en ai entendu parler mais je ne la fais pas", points: 3 },
      { label: "J'essaie mais c'est rarement réussi", points: 6 },
      { label: 'Je la fais parfois et plutôt bien', points: 9 },
      { label: 'Je la fais régulièrement et bien', points: 12 },
    ],
  },
  {
    text: 'Et la víbora (la variante slicée de la bandeja) ?',
    group: 'advanced',
    options: [
      { label: 'Jamais entendu parler', points: 0 },
      { label: 'Je connais mais je ne la fais pas', points: 2 },
      { label: "J'essaie de temps en temps", points: 4 },
      { label: "J'arrive à la faire assez souvent", points: 7 },
      { label: "Oui, c'est un coup que je maîtrise", points: 9 },
    ],
  },
  {
    text: 'Quand la balle rebondit dans le fond (double vitre), arrives-tu à attaquer depuis cette position ?',
    group: 'advanced',
    options: [
      { label: 'Je galère juste pour la remettre', points: 0 },
      { label: 'Je la remets simplement, sans plus', points: 2 },
      { label: 'Je la remets toujours avec contrôle', points: 3 },
      { label: "J'arrive parfois à attaquer depuis cette position", points: 5 },
      { label: "J'attaque régulièrement et surprends l'adversaire", points: 7 },
    ],
  },
  {
    text: 'Et sur une balle qui part vers la vitre latérale, arrives-tu à attaquer ?',
    group: 'advanced',
    options: [
      { label: 'Je galère juste pour la remettre', points: 0 },
      { label: 'Je la remets simplement, sans plus', points: 2 },
      { label: 'Je la remets toujours avec contrôle', points: 3 },
      { label: "J'arrive parfois à attaquer depuis cette position", points: 4 },
      { label: "J'attaque régulièrement depuis cette position", points: 6 },
    ],
  },
  {
    text: "Sais-tu faire une chiquita ou jouer un contre-pied pour casser le rythme de l'adversaire ?",
    group: 'advanced',
    options: [
      { label: 'Non, je ne sais pas', points: 0 },
      { label: "J'essaie mais c'est rarement réussi", points: 2 },
      { label: 'Je la fais correctement de temps en temps', points: 4 },
      { label: 'Je la fais bien régulièrement', points: 5 },
      { label: "Oui, je l'utilise comme arme tactique", points: 7 },
    ],
  },
  {
    text: 'As-tu déjà joué en compétition ou en tournoi de padel ?',
    group: 'advanced',
    options: [
      { label: 'Jamais', points: 0 },
      { label: 'Quelques matchs amicaux engagés', points: 2 },
      { label: 'Oui, en tournoi amateur occasionnel', points: 5 },
      { label: 'Oui, régulièrement en tournoi amateur', points: 8 },
      { label: 'Oui, régulièrement en compétition classée', points: 10 },
    ],
  },
  {
    text: 'Depuis combien de temps et à quel rythme joues-tu au padel ?',
    group: 'advanced',
    options: [
      { label: 'Moins de 6 mois, occasionnellement', points: 0 },
      { label: '6 mois à 2 ans, quelques fois par mois', points: 2 },
      { label: '1 à 3 ans, environ 1 fois par semaine', points: 4 },
      { label: '3 à 5 ans, 2 à 3 fois par semaine', points: 7 },
      { label: 'Plus de 5 ans, pratique très régulière ou coaching suivi', points: 9 },
    ],
  },
];

// Score total /100 : fondamentaux (5 questions, 40 pts max) + coups d'attaque,
// jeu de vitres offensif, finesse, compétition et expérience (7 questions, 60 pts max).
// Sans coups d'attaque ni expérience compétitive, le score plafonne autour de 40 (P100) même
// avec des fondamentaux parfaits : ça évite de surestimer un joueur qui n'a "que" de bons coups de base.
const LEVEL_THRESHOLDS: { max: number; level: Level }[] = [
  { max: 14, level: 'P25' },
  { max: 29, level: 'P50' },
  { max: 56, level: 'P100' },
  { max: 74, level: 'P250' },
  { max: 89, level: 'P500' },
  { max: 100, level: 'P1000' },
];

function levelFromScore(score: number): Level {
  return (LEVEL_THRESHOLDS.find((t) => score <= t.max) ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]).level;
}

const FUNDAMENTALS_MAX = QUESTIONS.filter((q) => q.group === 'fundamentals').reduce(
  (sum, q) => sum + q.options[q.options.length - 1].points,
  0
);
const ADVANCED_MAX = QUESTIONS.filter((q) => q.group === 'advanced').reduce(
  (sum, q) => sum + q.options[q.options.length - 1].points,
  0
);

export default function ProfileScreen() {
  const { token, refreshUser, signOut } = useAuth();
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDone = step >= QUESTIONS.length;
  const fundamentalsScore = QUESTIONS.reduce(
    (sum, q, i) => (q.group === 'fundamentals' ? sum + (answers[i] ?? 0) : sum),
    0
  );
  const advancedScore = QUESTIONS.reduce(
    (sum, q, i) => (q.group === 'advanced' ? sum + (answers[i] ?? 0) : sum),
    0
  );
  const totalScore = fundamentalsScore + advancedScore;
  const estimatedLevel = isDone ? levelFromScore(totalScore) : null;

  function answer(points: number) {
    setAnswers((prev) => [...prev, points]);
    setStep((s) => s + 1);
  }

  async function handleConfirm() {
    if (!token || !estimatedLevel) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await api.updateProfile(token, { level: estimatedLevel });
      await refreshUser();
      router.replace('/availability');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mise à jour impossible');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Quiz de niveau
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Réponds honnêtement, on estime ton niveau réel pour te trouver des partenaires compatibles.
        </ThemedText>

        {!isDone ? (
          <Card style={styles.card}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.progress}>
              QUESTION {step + 1}/{QUESTIONS.length}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.question}>
              {QUESTIONS[step].text}
            </ThemedText>

            <ThemedView style={styles.optionList}>
              {QUESTIONS[step].options.map((opt) => (
                <Pressable
                  key={opt.label}
                  onPress={() => answer(opt.points)}
                  style={[styles.option, { borderColor: theme.border }]}
                >
                  <ThemedText>{opt.label}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
          </Card>
        ) : (
          <Card style={styles.card}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.progress}>
              RÉSULTAT
            </ThemedText>
            <ThemedText type="title" style={[styles.resultLevel, { color: theme.primary }]}>
              {estimatedLevel}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.resultHint}>
              Score total : {totalScore}/100
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.resultDetail}>
              Fondamentaux : {fundamentalsScore}/{FUNDAMENTALS_MAX} · Coups d'attaque, vitres offensives,
              finesse et expérience : {advancedScore}/{ADVANCED_MAX}
            </ThemedText>

            {error && (
              <ThemedText themeColor="danger" style={styles.error}>
                {error}
              </ThemedText>
            )}

            <PrimaryButton
              label={isSubmitting ? 'Enregistrement...' : 'Continuer'}
              onPress={handleConfirm}
              disabled={isSubmitting}
              style={styles.submit}
            />
          </Card>
        )}

        <Pressable
          onPress={async () => {
            await signOut();
            router.replace('/login');
          }}
          style={styles.logout}
        >
          <ThemedText type="link" themeColor="danger">
            Se déconnecter
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  title: { fontSize: 30, lineHeight: 36 },
  subtitle: { fontSize: 15, marginBottom: Spacing.one },
  card: { gap: Spacing.two },
  progress: { letterSpacing: 0.5 },
  question: { fontSize: 20, lineHeight: 26 },
  optionList: { gap: Spacing.two, marginTop: Spacing.one },
  option: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  resultLevel: { fontSize: 40, textAlign: 'center', marginTop: Spacing.one },
  resultHint: { textAlign: 'center', fontSize: 14, marginTop: Spacing.one },
  resultDetail: { textAlign: 'center', fontSize: 13 },
  error: { fontSize: 14 },
  submit: { marginTop: Spacing.two },
  logout: { alignSelf: 'center', marginTop: Spacing.two },
});
