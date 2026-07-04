const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const prisma = require('../db');
const { sendPasswordResetEmail } = require('../mailer');

const router = express.Router();

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives, réessaie dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash, availableDates: [] } });

  res.status(201).json({ token: signToken(user.id), user: toPublicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: 'Votre compte a été banni suite à un signalement.' });
  }

  res.json({ token: signToken(user.id), user: toPublicUser(user) });
});

router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.isBanned) {
    return res.json({ expiresInMinutes: 15 });
  }

  const resetCode = String(Math.floor(100000 + Math.random() * 900000));
  const resetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetCode, resetCodeExpiresAt },
  });

  if (process.env.NODE_ENV !== 'production' && !process.env.GMAIL_APP_PASSWORD) {
    // Dev mode sans email configuré : retourne le code directement.
    return res.json({ resetCode, expiresInMinutes: 15 });
  }

  try {
    await sendPasswordResetEmail(user.email, resetCode);
  } catch (err) {
    console.error('[forgot-password] Échec envoi email:', err);
    return res.status(500).json({ error: "Impossible d'envoyer l'email. Réessaie plus tard." });
  }

  res.json({ expiresInMinutes: 15 });
});

router.post('/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'email and code are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (
    !user ||
    !user.resetCode ||
    user.resetCode !== code ||
    !user.resetCodeExpiresAt ||
    user.resetCodeExpiresAt < new Date()
  ) {
    return res.status(400).json({ error: 'Code invalide ou expiré' });
  }

  res.json({ valid: true });
});

router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'email, code and newPassword are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (
    !user ||
    !user.resetCode ||
    user.resetCode !== code ||
    !user.resetCodeExpiresAt ||
    user.resetCodeExpiresAt < new Date()
  ) {
    return res.status(400).json({ error: 'Invalid or expired code' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetCode: null, resetCodeExpiresAt: null },
  });

  res.json({ token: signToken(user.id), user: toPublicUser(user) });
});

module.exports = router;
