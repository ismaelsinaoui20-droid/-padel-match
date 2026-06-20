export function isMatchPast(date: string, time: string | null): boolean {
  if (!time) return false;
  const matchDateTime = new Date(`${date}T${time}:00`);
  return matchDateTime.getTime() < Date.now();
}
