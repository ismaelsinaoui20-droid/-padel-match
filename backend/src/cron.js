const cron = require('node-cron');
const prisma = require('./db');
const { getCycleStart, toISODate } = require('./cycle');

async function resetCycle() {
  await prisma.message.deleteMany({});
  await prisma.timeVote.deleteMany({});
  await prisma.courtBookingVote.deleteMany({});
  await prisma.matchGroupMember.deleteMany({});
  await prisma.matchGroup.deleteMany({});
  await prisma.user.updateMany({ data: { availableDates: [] } });
  console.log('[cron] Cycle reset: availability and groups cleared, accounts kept.');
}

function scheduleCycleReset() {
  cron.schedule('0 0 * * 1', async () => {
    try {
      const today = toISODate(new Date());
      const cycleStart = getCycleStart();
      if (today !== cycleStart) {
        console.log(`[cron] Monday ${today} is mid-cycle (cycle started ${cycleStart}), skipping reset.`);
        return;
      }
      await resetCycle();
    } catch (err) {
      console.error('[cron] Cycle reset failed:', err);
    }
  });
}

module.exports = { resetCycle, scheduleCycleReset };
