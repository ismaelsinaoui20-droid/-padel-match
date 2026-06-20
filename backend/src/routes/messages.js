const express = require('express');
const prisma = require('../db');
const { requireAuth, isAdminUser } = require('../middleware/auth');

const router = express.Router();

async function assertMember(groupId, userId) {
  const membership = await prisma.matchGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return Boolean(membership);
}

router.get('/:groupId', requireAuth, async (req, res) => {
  const { groupId } = req.params;
  const isMember = await assertMember(groupId, req.userId);
  if (!isMember && !(await isAdminUser(req.userId))) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  const messages = await prisma.message.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true, isAdmin: true } } },
    orderBy: { createdAt: 'asc' },
  });

  if (isMember) {
    await prisma.matchGroupMember.update({
      where: { groupId_userId: { groupId, userId: req.userId } },
      data: { lastReadAt: new Date() },
    });
  }

  res.json({ messages });
});

module.exports = router;
