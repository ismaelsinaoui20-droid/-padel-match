const express = require('express');
const prisma = require('../db');
const { requireAuth, isAdminUser } = require('../middleware/auth');

const router = express.Router();

async function canChat(userId, otherId) {
  if (await isAdminUser(userId)) return true;
  if (await isAdminUser(otherId)) return true;

  const rel = await prisma.savedPlayer.findFirst({
    where: {
      OR: [
        { userId, savedUserId: otherId },
        { userId: otherId, savedUserId: userId },
      ],
    },
  });
  return Boolean(rel);
}

router.get('/unread-count', requireAuth, async (req, res) => {
  const count = await prisma.directMessage.count({
    where: { recipientId: req.userId, read: false },
  });
  res.json({ count });
});

router.get('/conversations', requireAuth, async (req, res) => {
  const messages = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: req.userId }, { recipientId: req.userId }] },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true } },
      recipient: { select: { id: true, name: true } },
    },
  });

  const conversations = new Map();
  for (const m of messages) {
    const isMine = m.senderId === req.userId;
    const other = isMine ? m.recipient : m.sender;
    if (!conversations.has(other.id)) {
      conversations.set(other.id, {
        userId: other.id,
        name: other.name,
        lastMessage: m.content,
        lastMessageAt: m.createdAt,
        fromMe: isMine,
        unreadCount: 0,
      });
    }
    if (!isMine && !m.read) {
      conversations.get(other.id).unreadCount += 1;
    }
  }

  res.json({ conversations: [...conversations.values()] });
});

router.get('/:userId', requireAuth, async (req, res) => {
  const otherId = req.params.userId;
  if (!(await canChat(req.userId, otherId))) {
    return res.status(403).json({ error: 'You must save this player before chatting' });
  }

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: req.userId, recipientId: otherId },
        { senderId: otherId, recipientId: req.userId },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  await prisma.directMessage.updateMany({
    where: { senderId: otherId, recipientId: req.userId, read: false },
    data: { read: true },
  });

  res.json({ messages });
});

module.exports = { router, canChat };
