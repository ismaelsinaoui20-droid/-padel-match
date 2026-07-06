require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const matchingRoutes = require('./routes/matching');
const messageRoutes = require('./routes/messages');
const playerRoutes = require('./routes/players');
const adminRoutes = require('./routes/admin');
const { router: directMessageRoutes } = require('./routes/direct-messages');
const { registerChatSockets } = require('./sockets/chat');
const { scheduleCycleReset, resetCycle } = require('./cron');
const { getCycleStart, toISODate } = require('./cycle');
const prisma = require('./db');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/matching', matchingRoutes);
app.use('/messages', messageRoutes);
app.use('/players', playerRoutes);
app.use('/admin', adminRoutes);
app.use('/dm', directMessageRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
registerChatSockets(io);

scheduleCycleReset();

// Au démarrage, vérifie si des groupes de l'ancien cycle existent encore
async function checkCycleOnStartup() {
  try {
    const cycleStart = getCycleStart();
    const oldGroup = await prisma.matchGroup.findFirst({
      where: { createdAt: { lt: cycleStart } },
    });
    if (oldGroup) {
      console.log('[startup] Anciens groupes détectés, reset du cycle en cours...');
      await resetCycle();
    }
  } catch (err) {
    console.error('[startup] Vérification cycle échouée:', err);
  }
}

const port = process.env.PORT || 4000;
server.listen(port, async () => {
  console.log(`padel-match backend listening on port ${port}`);
  await checkCycleOnStartup();
});
