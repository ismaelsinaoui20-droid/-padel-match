const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');
const { getUpcomingCycleDates } = require('../cycle');
const { GROUP_INCLUDE, formatDateLabel, addMemberToGroup, addDuoToGroup } = require('../group-helpers');

const router = express.Router();

async function countUnread(groupId, userId, since) {
  const notMe = { OR: [{ userId: { not: userId } }, { userId: null }] };

  const [messages, timeVotes, courtVotes] = await Promise.all([
    prisma.message.count({ where: { groupId, createdAt: { gt: since }, ...notMe } }),
    prisma.timeVote.count({ where: { groupId, createdAt: { gt: since }, userId: { not: userId } } }),
    prisma.courtBookingVote.count({ where: { groupId, createdAt: { gt: since }, userId: { not: userId } } }),
  ]);

  return messages + timeVotes + courtVotes;
}

async function loadGroup(groupId, userId) {
  const group = await prisma.matchGroup.findUnique({
    where: { id: groupId },
    include: GROUP_INCLUDE,
  });
  if (!group || !userId) return { ...group, unreadCount: 0 };

  const membership = await prisma.matchGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  const unreadCount = membership ? await countUnread(groupId, userId, membership.lastReadAt) : 0;
  return { ...group, unreadCount };
}

async function loadUserGroups(userId) {
  const memberships = await prisma.matchGroupMember.findMany({
    where: { userId },
    include: { group: { include: GROUP_INCLUDE } },
    orderBy: { joinedAt: 'asc' },
  });

  return Promise.all(
    memberships.map(async (m) => {
      const unreadCount = await countUnread(m.groupId, userId, m.lastReadAt);
      return { ...m.group, unreadCount };
    })
  );
}

router.get('/cycle', requireAuth, async (req, res) => {
  const { cycleStart, dates } = getUpcomingCycleDates();
  res.json({ cycleStart, dates: dates.map((date) => ({ date, label: formatDateLabel(date) })) });
});

router.get('/status', requireAuth, async (req, res) => {
  const groups = await loadUserGroups(req.userId);
  res.json({ groups });
});

router.post('/find', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user.level || !user.region || !user.availableDates.length) {
    return res.status(400).json({ error: 'Complete your profile (region, level and available dates) before matching' });
  }

  const { dates: validDates } = getUpcomingCycleDates();
  const activeDates = user.availableDates.filter((d) => validDates.includes(d));

  const existingMemberships = await prisma.matchGroupMember.findMany({
    where: { userId: user.id },
    include: { group: true },
  });
  if (existingMemberships.some((m) => m.group.isDuo)) {
    return res.status(400).json({ error: 'Tu es déjà inscrit en binôme, la recherche solo est désactivée' });
  }

  const groupsById = new Map();
  for (const m of existingMemberships) {
    groupsById.set(m.groupId, await loadGroup(m.groupId, user.id));
  }
  const coveredDates = new Set([...groupsById.values()].map((g) => g.date));

  for (const date of activeDates) {
    if (coveredDates.has(date)) continue;

    let group = await prisma.matchGroup.findFirst({
      where: { level: user.level, region: user.region, date, status: 'OPEN', isDuo: false },
    });

    if (!group) {
      group = await prisma.matchGroup.create({ data: { level: user.level, region: user.region, date, isDuo: false } });
    }

    await addMemberToGroup(group.id, user.id);

    groupsById.set(group.id, await loadGroup(group.id, user.id));
    coveredDates.add(date);
  }

  res.json({ groups: [...groupsById.values()] });
});

router.post('/find-duo', requireAuth, async (req, res) => {
  const { partnerId } = req.body;
  if (!partnerId || partnerId === req.userId) {
    return res.status(400).json({ error: 'A valid partnerId is required' });
  }

  const [user, partner] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.userId } }),
    prisma.user.findUnique({ where: { id: partnerId } }),
  ]);

  if (!partner || partner.isAdmin) {
    return res.status(404).json({ error: 'Partner not found' });
  }
  if (!user.level || !user.region || !user.availableDates.length) {
    return res.status(400).json({ error: 'Complete your profile (region, level and available dates) before matching' });
  }
  if (!partner.level || !partner.region || !partner.availableDates.length) {
    return res.status(400).json({ error: "Ton binôme doit aussi compléter son profil (région, niveau et disponibilités)" });
  }
  if (user.level !== partner.level || user.region !== partner.region) {
    return res.status(400).json({ error: 'Toi et ton binôme devez avoir le même niveau et la même région' });
  }

  const { dates: validDates } = getUpcomingCycleDates();
  const activeDates = user.availableDates.filter((d) => validDates.includes(d) && partner.availableDates.includes(d));
  if (!activeDates.length) {
    return res.status(400).json({ error: 'Aucune date commune disponible avec ton binôme' });
  }

  const existingMemberships = await prisma.matchGroupMember.findMany({
    where: { userId: { in: [user.id, partner.id] } },
    include: { group: true },
  });
  const coveredDates = new Set(existingMemberships.map((m) => m.group.date));

  const groupsById = new Map();
  for (const m of existingMemberships) {
    if (!groupsById.has(m.groupId)) {
      groupsById.set(m.groupId, await loadGroup(m.groupId, user.id));
    }
  }

  for (const date of activeDates) {
    if (coveredDates.has(date)) continue;

    let group = await prisma.matchGroup.findFirst({
      where: { level: user.level, region: user.region, date, status: 'OPEN', isDuo: true },
    });

    if (!group) {
      group = await prisma.matchGroup.create({ data: { level: user.level, region: user.region, date, isDuo: true } });
    }

    await addDuoToGroup(group.id, user.id, partner.id);

    groupsById.set(group.id, await loadGroup(group.id, user.id));
    coveredDates.add(date);
  }

  res.json({ groups: [...groupsById.values()] });
});

module.exports = router;
