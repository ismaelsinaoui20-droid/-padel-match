const EPOCH = new Date('2026-01-05T00:00:00');
const EPOCH_MONDAY = (() => {
  const dow = EPOCH.getDay();
  const monday = new Date(EPOCH);
  monday.setDate(EPOCH.getDate() - ((dow + 6) % 7));
  return monday;
})();

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mostRecentMonday(now) {
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((dow + 6) % 7));
  return monday;
}

function getCycleStart(now = new Date()) {
  const recentMonday = mostRecentMonday(now);
  const diffDays = Math.round((recentMonday - EPOCH_MONDAY) / 86400000);
  const weeksSinceEpoch = Math.floor(diffDays / 7);
  const isOddWeek = ((weeksSinceEpoch % 2) + 2) % 2 === 1;
  const cycleStart = new Date(recentMonday);
  if (isOddWeek) cycleStart.setDate(recentMonday.getDate() - 7);
  return cycleStart;
}

function getCycleDates(now = new Date()) {
  const cycleStart = getCycleStart(now);
  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(cycleStart);
    d.setDate(cycleStart.getDate() + i);
    dates.push(toISODate(d));
  }
  return { cycleStart: toISODate(cycleStart), dates };
}

function getUpcomingCycleDates(now = new Date()) {
  const { cycleStart, dates } = getCycleDates(now);
  const today = toISODate(now);
  return { cycleStart, dates: dates.filter((d) => d >= today) };
}

module.exports = { getCycleStart, getCycleDates, getUpcomingCycleDates, toISODate };
