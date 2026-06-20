type Timestamped = { id: string; createdAt: string };

export function mergeMessages<T extends Timestamped>(existing: T[], incoming: T[]): T[] {
  const byId = new Map(existing.map((m) => [m.id, m]));
  for (const message of incoming) {
    byId.set(message.id, message);
  }
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
