const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');
const { getUpcomingCycleDates } = require('../cycle');

const router = express.Router();

const LEVELS = ['P25', 'P50', 'P100', 'P250', 'P500', 'P1000'];

function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  res.json(toPublicUser(user));
});

router.put('/me', requireAuth, async (req, res) => {
  const { age, region, level, availableDates } = req.body;

  if (level !== undefined && !LEVELS.includes(level)) {
    return res.status(400).json({ error: `level must be one of ${LEVELS.join(', ')}` });
  }
  if (availableDates !== undefined) {
    const { dates: validDates } = getUpcomingCycleDates();
    if (!Array.isArray(availableDates) || availableDates.some((d) => !validDates.includes(d))) {
      return res.status(400).json({ error: `availableDates must be a subset of the current cycle dates` });
    }
  }
  if (age !== undefined && (typeof age !== 'number' || age < 0 || age > 120)) {
    return res.status(400).json({ error: 'age must be a realistic number' });
  }
  if (region !== undefined && (typeof region !== 'string' || !region.trim())) {
    return res.status(400).json({ error: 'region must be a non-empty string' });
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { age, region: region?.trim(), level, availableDates },
  });

  res.json(toPublicUser(user));
});

module.exports = router;
