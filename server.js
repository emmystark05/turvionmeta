const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const http = require('http');             // NEW
const { Server } = require('socket.io'); // NEW  →  npm install socket.io
const { v4: uuidv4 } = require('uuid'); // NEW  →  npm install uuid

const app = express();
const server = http.createServer(app);   // wrap app — replaces app.listen below
const PORT = process.env.PORT || 3001;

// ─── Socket.io real-time chat ─────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// In-memory store — replace with DB table when ready
const chatSessions = {}; // id → { sessionId, userId, userName, paymentMethod, messages[], status, … }
const userSockets  = {}; // sessionId → socketId

io.on('connection', (socket) => {

  // Admin auth — call socket.emit('admin:join') from admin page after verifying session
  socket.on('admin:join', () => {
    socket.join('admins');
    socket.emit('admin:sessions', Object.values(chatSessions));
  });

  // User opens donate page and picks a payment method
  socket.on('user:start_session', ({ userId, userName, paymentMethod }) => {
    let sid = Object.keys(chatSessions).find(
      id => chatSessions[id].userId === String(userId) && chatSessions[id].status === 'open'
    );
    if (!sid) {
      sid = uuidv4();
      chatSessions[sid] = {
        sessionId: sid, userId: String(userId), userName: userName || 'Guest',
        paymentMethod, messages: [], status: 'open',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        unreadCount: 0,
      };
    }
    userSockets[sid] = socket.id;
    socket.join(`session:${sid}`);
    socket.emit('user:session_ready', { sessionId: sid, session: chatSessions[sid] });
    io.to('admins').emit('admin:session_update', chatSessions[sid]);
    io.to('admins').emit('admin:new_session_notification', {
      sessionId: sid, userName: chatSessions[sid].userName, paymentMethod
    });
  });

  socket.on('user:rejoin_session', ({ sessionId, userId }) => {
    const s = chatSessions[sessionId];
    if (!s || s.userId !== String(userId)) return socket.emit('user:error', { message: 'Session not found' });
    userSockets[sessionId] = socket.id;
    socket.join(`session:${sessionId}`);
    socket.emit('user:session_ready', { sessionId, session: s });
  });

  socket.on('user:message', ({ sessionId, userId, text }) => {
    const s = chatSessions[sessionId];
    if (!s || s.userId !== String(userId)) return;
    const msg = {
      id: uuidv4(), sender: 'user', senderName: s.userName,
      text: text.trim(), timestamp: new Date().toISOString(),
    };
    s.messages.push(msg);
    s.lastActivity = msg.timestamp;
    s.unreadCount = (s.unreadCount || 0) + 1;
    io.to(`session:${sessionId}`).emit('chat:new_message', { sessionId, message: msg });
    io.to('admins').emit('admin:new_user_message', {
      sessionId, message: msg, userName: s.userName,
      paymentMethod: s.paymentMethod, unreadCount: s.unreadCount
    });
    io.to('admins').emit('admin:session_update', s);
  });

  socket.on('admin:join_session', ({ sessionId }) => {
    socket.join(`session:${sessionId}`);
    const s = chatSessions[sessionId];
    if (s) socket.emit('admin:session_history', { sessionId, session: s });
  });

  socket.on('admin:message', ({ sessionId, text }) => {
    const s = chatSessions[sessionId];
    if (!s) return;
    const msg = {
      id: uuidv4(), sender: 'admin', senderName: 'Support Agent',
      text: text.trim(), timestamp: new Date().toISOString(),
    };
    s.messages.push(msg);
    s.lastActivity = msg.timestamp;
    s.unreadCount = 0;
    io.to(`session:${sessionId}`).emit('chat:new_message', { sessionId, message: msg });
    io.to('admins').emit('admin:session_update', s);
  });

  socket.on('admin:resolve_session', ({ sessionId }) => {
    const s = chatSessions[sessionId];
    if (!s) return;
    s.status = 'resolved';
    io.to(`session:${sessionId}`).emit('chat:session_resolved', { sessionId });
    io.to('admins').emit('admin:session_update', s);
  });

  socket.on('admin:typing', ({ sessionId, isTyping }) => {
    socket.to(`session:${sessionId}`).emit('chat:admin_typing', { isTyping });
  });
  socket.on('user:typing', ({ sessionId, isTyping }) => {
    const s = chatSessions[sessionId];
    socket.to(`session:${sessionId}`).emit('chat:user_typing', {
      sessionId, isTyping, userName: s?.userName
    });
  });

  socket.on('disconnect', () => {
    for (const [sid, sockId] of Object.entries(userSockets)) {
      if (sockId === socket.id) {
        delete userSockets[sid];
        io.to('admins').emit('admin:user_offline', { sessionId: sid });
      }
    }
  });
});

// ─── Existing middleware (untouched) ─────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.static(path.join(__dirname)));
app.use(session({
  secret: 'broker-platform-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

// ─── Database (untouched) ─────────────────────────────────────────────────────


// ─── Database ─────────────────────────────────────────────────────────────────
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, 'app.db'));
console.log('✓ Connected to SQLite database');
initializeDatabase();

function initializeDatabase() {
  db.prepare(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    isAdmin BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  console.log('✓ Users table ready');

  db.prepare(`CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER UNIQUE NOT NULL,
    BTC REAL DEFAULT 0, ETH REAL DEFAULT 0, USDT REAL DEFAULT 0,
    BNB REAL DEFAULT 0, SOL REAL DEFAULT 0, XRP REAL DEFAULT 0,
    ADA REAL DEFAULT 0, DOGE REAL DEFAULT 0, AVAX REAL DEFAULT 0,
    LINK REAL DEFAULT 0, totalValue REAL DEFAULT 0,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )`).run();
  console.log('✓ Portfolio table ready');

  const adminEmail = 'admin@stark', adminPassword = 'stark';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existing) {
    const hp = bcrypt.hashSync(adminPassword, 10);
    const result = db.prepare(
      `INSERT INTO users (fullName, email, phone, password, isAdmin, status) VALUES (?, ?, ?, ?, ?, ?)`
    ).run('Admin User', adminEmail, '+1234567890', hp, 1, 'active');
    db.prepare(`INSERT INTO portfolio (userId) VALUES (?)`).run(result.lastInsertRowid);
    console.log('✓ Admin user created');
  }
}

function dbRun(q, p = []) {
  try {
    const stmt = db.prepare(q);
    const result = stmt.run(...p);
    return Promise.resolve({ id: result.lastInsertRowid, changes: result.changes });
  } catch(e) { return Promise.reject(e); }
}
function dbGet(q, p = []) {
  try {
    const stmt = db.prepare(q);
    return Promise.resolve(stmt.get(...p));
  } catch(e) { return Promise.reject(e); }
}
function dbAll(q, p = []) {
  try {
    const stmt = db.prepare(q);
    return Promise.resolve(stmt.all(...p));
  } catch(e) { return Promise.reject(e); }
}

// ─── Auth Middleware (untouched) ──────────────────────────────────────────────
const requireAuth  = (req, res, next) => req.session.userId ? next() : res.status(401).json({ error: 'Not authenticated' });
const requireAdmin = (req, res, next) => (req.session.userId && req.session.isAdmin) ? next() : res.status(403).json({ error: 'Admin access required' });

// ─── All existing routes (untouched) ─────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await dbRun(`INSERT INTO users (fullName, email, phone, password, status) VALUES (?, ?, ?, ?, ?)`, [fullName, email, phone, hashedPassword, 'active']);
    await dbRun(`INSERT INTO portfolio (userId) VALUES (?)`, [result.id]);
    res.status(201).json({ message: 'User created successfully', userId: result.id });
  } catch (error) {
    if (error.message.includes('UNIQUE')) res.status(400).json({ error: 'Email already exists' });
    else res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await dbGet(`SELECT id, fullName, email, isAdmin FROM users WHERE email = ?`, [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const userFull = await dbGet(`SELECT password FROM users WHERE id = ?`, [user.id]);
    if (!bcrypt.compareSync(password, userFull.password)) return res.status(401).json({ error: 'Invalid credentials' });
    req.session.userId = user.id;
    req.session.isAdmin = user.isAdmin;
    req.session.email = user.email;
    res.json({ message: 'Login successful', user: { id: user.id, fullName: user.fullName, email: user.email, isAdmin: user.isAdmin } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await dbGet(`SELECT id, fullName, email, isAdmin FROM users WHERE id = ?`, [req.session.userId]);
    res.json({ user });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/portfolio/:userId', requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (req.session.userId !== userId && !req.session.isAdmin) return res.status(403).json({ error: 'Access denied' });
    const portfolio = await dbGet(`SELECT * FROM portfolio WHERE userId = ?`, [userId]);
    if (!portfolio) return res.status(404).json({ error: 'Portfolio not found' });
    res.json({ portfolio });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/portfolio', requireAuth, async (req, res) => {
  try {
    const portfolio = await dbGet(`SELECT * FROM portfolio WHERE userId = ?`, [req.session.userId]);
    if (!portfolio) return res.status(404).json({ error: 'Portfolio not found' });
    res.json({ portfolio });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/portfolio/:userId', requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { BTC, ETH, USDT, BNB, SOL, XRP, ADA, DOGE, AVAX, LINK, totalValue } = req.body;
    if (req.session.userId !== userId && !req.session.isAdmin) return res.status(403).json({ error: 'Access denied' });
    const updates = [], values = [];
    if (BTC !== undefined)        { updates.push('BTC = ?');        values.push(BTC); }
    if (ETH !== undefined)        { updates.push('ETH = ?');        values.push(ETH); }
    if (USDT !== undefined)       { updates.push('USDT = ?');       values.push(USDT); }
    if (BNB !== undefined)        { updates.push('BNB = ?');        values.push(BNB); }
    if (SOL !== undefined)        { updates.push('SOL = ?');        values.push(SOL); }
    if (XRP !== undefined)        { updates.push('XRP = ?');        values.push(XRP); }
    if (ADA !== undefined)        { updates.push('ADA = ?');        values.push(ADA); }
    if (DOGE !== undefined)       { updates.push('DOGE = ?');       values.push(DOGE); }
    if (AVAX !== undefined)       { updates.push('AVAX = ?');       values.push(AVAX); }
    if (LINK !== undefined)       { updates.push('LINK = ?');       values.push(LINK); }
    if (totalValue !== undefined) { updates.push('totalValue = ?'); values.push(totalValue); }
    if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });
    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(userId);
    await dbRun(`UPDATE portfolio SET ${updates.join(', ')} WHERE userId = ?`, values);
    const updatedPortfolio = await dbGet(`SELECT * FROM portfolio WHERE userId = ?`, [userId]);
    res.json({ message: 'Portfolio updated successfully', portfolio: updatedPortfolio });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/portfolio/:userId/asset/:asset', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const asset = req.params.asset.toUpperCase();
    const { quantity } = req.body;
    const validAssets = ['BTC','ETH','USDT','BNB','SOL','XRP','ADA','DOGE','AVAX','LINK'];
    if (!validAssets.includes(asset)) return res.status(400).json({ error: 'Invalid asset' });
    if (quantity === undefined || quantity < 0) return res.status(400).json({ error: 'Invalid quantity' });
    await dbRun(`UPDATE portfolio SET ${asset} = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`, [quantity, userId]);
    const updatedPortfolio = await dbGet(`SELECT * FROM portfolio WHERE userId = ?`, [userId]);
    res.json({ message: `${asset} updated successfully`, portfolio: updatedPortfolio });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await dbAll(`
      SELECT u.id, u.fullName, u.email, u.phone, u.status, u.createdAt,
             p.BTC, p.ETH, p.USDT, p.BNB, p.SOL, p.XRP, p.ADA, p.DOGE, p.AVAX, p.LINK, p.totalValue
      FROM users u LEFT JOIN portfolio p ON u.id = p.userId ORDER BY u.createdAt DESC`);
    res.json({ users });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const user = await dbGet(`
      SELECT u.id, u.fullName, u.email, u.phone, u.status, u.createdAt,
             p.BTC, p.ETH, p.USDT, p.BNB, p.SOL, p.XRP, p.ADA, p.DOGE, p.AVAX, p.LINK, p.totalValue
      FROM users u LEFT JOIN portfolio p ON u.id = p.userId WHERE u.id = ?`, [parseInt(req.params.userId)]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { status } = req.body;
    if (!['active','pending','flagged'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await dbRun(`UPDATE users SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [status, userId]);
    res.json({ message: 'User status updated' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (req.session.userId === userId) return res.status(400).json({ error: 'Cannot delete your own account' });
    await dbRun(`DELETE FROM users WHERE id = ?`, [userId]);
    res.json({ message: 'User deleted' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start — use server.listen (NOT app.listen) ────────────────────────────
server.listen(PORT, () => {
  console.log(`\n✅ TurvionMeta running on http://localhost:${PORT}`);
  console.log('✓ Admin credentials: admin@stark / stark');
  console.log('✓ Socket.io chat: enabled');
  console.log(`✓ Database: app.db\n`);
});

