const prisma = require('./db');

const MAX_GROUP_SIZE = 4;

const GROUP_INCLUDE = {
  members: { include: { user: { select: { id: true, name: true, isAdmin: true } } } },
  timeVotes: { include: { user: { select: { id: true, name: true } } } },
  courtBookingVotes: { include: { user: { select: { id: true, name: true } } } },
};

const WEEKDAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function formatDateLabel(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  const weekday = WEEKDAY_LABELS[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${weekday} ${day}/${month}`;
}

async function addMemberToGroup(groupId, userId) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.matchGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) return;

    const currentGroup = await tx.matchGroup.findUniqueOrThrow({
      where: { id: groupId },
      include: { members: true },
    });
    if (currentGroup.members.length >= MAX_GROUP_SIZE) {
      throw new Error('Group is already full');
    }

    await tx.matchGroupMember.create({ data: { groupId, userId } });

    const newSize = currentGroup.members.length + 1;
    if (currentGroup.status === 'OPEN' && newSize >= MAX_GROUP_SIZE) {
      await tx.matchGroup.update({ where: { id: groupId }, data: { status: 'FULL' } });
      await tx.message.create({
        data: {
          groupId,
          userId: null,
          content: "N'oubliez pas de réserver un terrain ! Mettez-vous d'accord !",
        },
      });
    }
  });
}

async function addDuoToGroup(groupId, userIdA, userIdB) {
  await prisma.$transaction(async (tx) => {
    const currentGroup = await tx.matchGroup.findUniqueOrThrow({
      where: { id: groupId },
      include: { members: true },
    });
    const alreadyIn = new Set(currentGroup.members.map((m) => m.userId));
    const toAdd = [userIdA, userIdB].filter((id) => !alreadyIn.has(id));

    if (currentGroup.members.length + toAdd.length > MAX_GROUP_SIZE) {
      throw new Error('Group cannot fit this duo');
    }

    for (const userId of toAdd) {
      await tx.matchGroupMember.create({ data: { groupId, userId } });
    }

    const newSize = currentGroup.members.length + toAdd.length;
    if (currentGroup.status === 'OPEN' && newSize >= MAX_GROUP_SIZE) {
      await tx.matchGroup.update({ where: { id: groupId }, data: { status: 'FULL' } });
      await tx.message.create({
        data: {
          groupId,
          userId: null,
          content: "N'oubliez pas de réserver un terrain ! Mettez-vous d'accord !",
        },
      });
    }
  });
}

module.exports = { MAX_GROUP_SIZE, GROUP_INCLUDE, formatDateLabel, addMemberToGroup, addDuoToGroup };
