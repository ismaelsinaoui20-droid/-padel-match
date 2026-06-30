const BASE = 'https://padel-match-dd8i.onrender.com';
async function post(path, body, token) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}
async function put(path, body, token) {
  const res = await fetch(BASE + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}
async function get(path, token) {
  const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

(async () => {
  await post('/auth/register', { name: 'ProdDuoA', email: 'prodduoa@test.com', password: 'test1234' });
  await post('/auth/register', { name: 'ProdDuoB', email: 'prodduob@test.com', password: 'test1234' });
  const a = (await post('/auth/login', { email: 'prodduoa@test.com', password: 'test1234' })).body;
  const b = (await post('/auth/login', { email: 'prodduob@test.com', password: 'test1234' })).body;

  const cycle = await get('/matching/cycle', a.token);
  const date = cycle.dates[0].date;
  await put('/profile/me', { level: 'P50', region: 'Tunis', availableDates: [date] }, a.token);
  await put('/profile/me', { level: 'P50', region: 'Tunis', availableDates: [date] }, b.token);

  const duoResult = await post('/matching/find-duo', { partnerId: b.user.id }, a.token);
  console.log('find-duo status:', duoResult.status);
  console.log('find-duo response:', JSON.stringify(duoResult.body));

  const statusA = await get('/matching/status', a.token);
  console.log('A status groups:', JSON.stringify(statusA.groups));

  const statusB = await get('/matching/status', b.token);
  console.log('B status groups:', JSON.stringify(statusB.groups));
})();
