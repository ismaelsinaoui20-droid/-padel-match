const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { GROUP_INCLUDE, addMemberToGroup } = require('../group-helpers');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function toPublicUser(user) {
  const { passwordHash, resetCode, resetCodeExpiresAt, ...publicUser } = user;
  return publicUser;
}

router.get('/groups', requireAuth, requireAdmin, async (req, res) => {
  const groups = await prisma.matchGroup.findMany({
    include: GROUP_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ groups: groups.map((g) => ({ ...g, unreadCount: 0 })) });
});

router.get('/players', requireAuth, requireAdmin, async (req, res) => {
  const players = await prisma.user.findMany({ where: { isAdmin: false }, orderBy: { createdAt: 'desc' } });
  res.json({ players: players.map(toPublicUser) });
});

router.get('/reports', requireAuth, requireAdmin, async (req, res) => {
  const reports = await prisma.playerReport.findMany({
    include: {
      reportedUser: { select: { id: true, name: true, email: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ reports });
});

router.post('/groups/:groupId/add-player', requireAuth, requireAdmin, async (req, res) => {
  const { groupId } = req.params;
  const { mode, name, email, password } = req.body;

  const group = await prisma.matchGroup.findUnique({ where: { id: groupId } });
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  let player;

  if (mode === 'register') {
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    player = await prisma.user.create({ data: { name, email, passwordHash, availableDates: [] } });
  } else if (mode === 'login') {
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    player = await prisma.user.findUnique({ where: { email } });
    if (!player || !(await bcrypt.compare(password, player.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
  } else {
    return res.status(400).json({ error: 'mode must be "register" or "login"' });
  }

  try {
    await addMemberToGroup(groupId, player.id);
  } catch (e) {
    return res.status(400).json({ error: 'Ce groupe est déjà complet (4 joueurs maximum)' });
  }

  const updatedGroup = await prisma.matchGroup.findUnique({ where: { id: groupId }, include: GROUP_INCLUDE });
  res.status(201).json({ player: toPublicUser(player), group: { ...updatedGroup, unreadCount: 0 } });
});

module.exports = router;
