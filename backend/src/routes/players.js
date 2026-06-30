const express = require('express');
const prisma = require('../db');
const { requireAuth, isAdminUser } = require('../middleware/auth');

const router = express.Router();

router.get('/search', requireAuth, async (req, res) => {
  const q = (req.query.q ?? '').trim();
  if (!q) {
    return res.json({ players: [] });
  }

  const players = await prisma.user.findMany({
    where: {
      isAdmin: false,
      id: { not: req.userId },
      name: { contains: q, mode: 'insensitive' },
    },
    select: { id: true, name: true, level: true, region: true },
    take: 10,
  });
  res.json({ players });
});

router.get('/saved', requireAuth, async (req, res) => {
  const saved = await prisma.savedPlayer.findMany({
    where: { userId: req.userId },
    include: { savedUser: { select: { id: true, name: true, level: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ players: saved.map((s) => s.savedUser) });
});

router.post('/:id/save', requireAuth, async (req, res) => {
  const savedUserId = req.params.id;
  if (savedUserId === req.userId) {
    return res.status(400).json({ error: 'Cannot save yourself' });
  }

  const target = await prisma.user.findUnique({ where: { id: savedUserId } });
  if (!target) {
    return res.status(404).json({ error: 'Player not found' });
  }

  await prisma.savedPlayer.upsert({
    where: { userId_savedUserId: { userId: req.userId, savedUserId } },
    update: {},
    create: { userId: req.userId, savedUserId },
  });

  res.status(201).json({ ok: true });
});

router.delete('/:id/save', requireAuth, async (req, res) => {
  await prisma.savedPlayer.deleteMany({
    where: { userId: req.userId, savedUserId: req.params.id },
  });
  res.json({ ok: true });
});

router.post('/:id/report', requireAuth, async (req, res) => {
  const reportedUserId = req.params.id;
  const { reason } = req.body;

  if (reportedUserId === req.userId) {
    return res.status(400).json({ error: 'Cannot report yourself' });
  }
  if (await isAdminUser(reportedUserId)) {
    return res.status(400).json({ error: 'Cannot report the administrator' });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'reason is required' });
  }

  await prisma.playerReport.create({
    data: { userId: req.userId, reportedUserId, reason: reason.trim() },
  });

  res.status(201).json({ ok: true });
});

module.exports = router;
