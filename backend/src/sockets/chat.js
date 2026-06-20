const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { canChat } = require('../routes/direct-messages');
const { isAdminUser } = require('../middleware/auth');

const TIME_PATTERN = /^([0-1]\d|2[0-3]):([0-5]\d)$/;

function dmRoom(userIdA, userIdB) {
  return `dm:${[userIdA, userIdB].sort().join(':')}`;
}

async function loadTimeVotes(groupId) {
  return prisma.timeVote.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true } } },
  });
}

async function loadCourtVotes(groupId) {
  return prisma.courtBookingVote.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true } } },
  });
}

function registerChatSockets(io) {
  io.use((socket, next) => {
    try {
      const payload = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_group', async (groupId) => {
      const membership = await prisma.matchGroupMember.findUnique({
        where: { groupId_userId: { groupId, userId: socket.userId } },
      });
      if (!membership && !(await isAdminUser(socket.userId))) return;
      socket.join(groupId);
    });

    socket.on('send_message', async ({ groupId, content }) => {
      if (!content || !content.trim()) return;

      const membership = await prisma.matchGroupMember.findUnique({
        where: { groupId_userId: { groupId, userId: socket.userId } },
      });
      const isAdmin = await isAdminUser(socket.userId);
      if (!membership && !isAdmin) return;

      const group = await prisma.matchGroup.findUnique({ where: { id: groupId } });
      if (!group || (!isAdmin && group.status === 'CONFIRMED' && group.courtBooked)) return;

      const message = await prisma.message.create({
        data: { groupId, userId: socket.userId, content: content.trim() },
        include: { user: { select: { id: true, name: true, isAdmin: true } } },
      });

      io.to(groupId).emit('new_message', message);
    });

    socket.on('propose_time', async ({ groupId, time }) => {
      if (!TIME_PATTERN.test(time)) return;

      const membership = await prisma.matchGroupMember.findUnique({
        where: { groupId_userId: { groupId, userId: socket.userId } },
      });
      if (!membership) return;

      const group = await prisma.matchGroup.findUnique({
        where: { id: groupId },
        include: { members: true },
      });
      if (!group || group.status !== 'FULL') return;

      await prisma.timeVote.upsert({
        where: { groupId_userId: { groupId, userId: socket.userId } },
        update: { time },
        create: { groupId, userId: socket.userId, time },
      });

      const votes = await loadTimeVotes(groupId);
      io.to(groupId).emit('time_votes_updated', { groupId, votes });

      const allAgree =
        votes.length === group.members.length && votes.every((v) => v.time === time);

      if (allAgree) {
        await prisma.matchGroup.update({
          where: { id: groupId },
          data: { status: 'CONFIRMED', confirmedTime: time },
        });
        io.to(groupId).emit('match_confirmed', { groupId, time });
      }
    });

    socket.on('confirm_court_booked', async ({ groupId }) => {
      const membership = await prisma.matchGroupMember.findUnique({
        where: { groupId_userId: { groupId, userId: socket.userId } },
      });
      if (!membership) return;

      const group = await prisma.matchGroup.findUnique({
        where: { id: groupId },
        include: { members: true },
      });
      if (!group || group.status !== 'CONFIRMED' || group.courtBooked) return;

      await prisma.courtBookingVote.upsert({
        where: { groupId_userId: { groupId, userId: socket.userId } },
        update: {},
        create: { groupId, userId: socket.userId },
      });

      const votes = await loadCourtVotes(groupId);
      io.to(groupId).emit('court_votes_updated', { groupId, votes });

      if (votes.length === group.members.length) {
        await prisma.matchGroup.update({ where: { id: groupId }, data: { courtBooked: true } });
        io.to(groupId).emit('court_booked_confirmed', { groupId });
      }
    });

    socket.on('join_dm', async ({ withUserId }) => {
      if (!(await canChat(socket.userId, withUserId))) return;
      socket.join(dmRoom(socket.userId, withUserId));
    });

    socket.on('send_dm', async ({ withUserId, content }) => {
      if (!content || !content.trim()) return;
      if (!(await canChat(socket.userId, withUserId))) return;

      const message = await prisma.directMessage.create({
        data: { senderId: socket.userId, recipientId: withUserId, content: content.trim() },
        include: { sender: { select: { id: true, name: true } } },
      });

      io.to(dmRoom(socket.userId, withUserId)).emit('new_dm', message);
    });
  });
}

module.exports = { registerChatSockets };
