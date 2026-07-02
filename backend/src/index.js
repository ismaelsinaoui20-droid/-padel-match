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
const { scheduleCycleReset } = require('./cron');

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

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`padel-match backend listening on port ${port}`));
