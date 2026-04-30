const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'db.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

const JWT_SECRET = process.env.JWT_SECRET || 'eventease_secret_2026';

function getDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initialDB = { users: [], events: [], bookings: [], nextId: 1 };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }
function generateId(db) { const id = db.nextId++; saveDB(db); return id; }

// Auto-seed demo user so your Flutter login works
const db = getDB();
if (!db.users.find(u => u.email === 'demo@eventease.com')) {
  const hashed = bcrypt.hashSync('Demo@1234', 10);
  db.users.push({
    id: 1, name: 'Demo User', email: 'demo@eventease.com',
    password: hashed, wallet: 350, friends: [2], createdAt: new Date()
  });
  db.events.push({
    id: 1, title: 'Tech Fest 2025', description: 'Annual tech festival',
    date: 'May 15, 2025', location: 'Mumbai', totalCost: 50000,
    maxAttendees: 50, organizer: 1, registeredUsers: [1], createdAt: new Date(),
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    tags: ['Technology', 'Networking', 'Workshop'], color1: '#6C63FF', color2: '#9B59B6', icon: 'computer_rounded'
  });
  db.nextId = 2;
  saveDB(db);
  console.log('🌱 Seeded demo@eventease.com / Demo@1234');
}

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (e) { res.status(401).json({ message: 'Invalid token' }); }
};

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const db = getDB();
    if (db.users.find(u => u.email === email)) return res.status(400).json({ message: 'Email exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: generateId(db), name, email, password: hashed, wallet: 100, friends: [], createdAt: new Date() };
    db.users.push(user); saveDB(db);
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, wallet: user.wallet } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// LOGIN - matches your Flutter
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(400).json({ message: 'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Wrong password' });
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, wallet: user.wallet } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET EVENTS
app.get('/api/events', async (req, res) => {
  try {
    const db = getDB();
    const userId = parseInt(req.query.userId) || 0;
    const user = db.users.find(u => u.id === userId);
    const events = db.events.map(e => {
      const count = e.registeredUsers.length;
      const price = count > 0? Math.ceil(e.totalCost / count) : e.totalCost;
      return {...e, currentPrice: price, spotsLeft: e.maxAttendees - count, friendGoing: user?.friends?.some(uid => e.registeredUsers.includes(uid)) || false };
    });
    res.json(events);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// BOOK EVENT
app.post('/api/book', auth, async (req, res) => {
  try {
    const { eventId } = req.body;
    const db = getDB();
    const event = db.events.find(e => e.id === eventId);
    const user = db.users.find(u => u.id === req.userId);
    if (!event || event.registeredUsers.includes(req.userId)) return res.status(400).json({ message: 'Cannot book' });

    const oldPrice = event.registeredUsers.length > 0? Math.ceil(event.totalCost / event.registeredUsers.length) : event.totalCost;
    event.registeredUsers.push(req.userId);
    const newPrice = Math.ceil(event.totalCost / event.registeredUsers.length);

    if (newPrice < oldPrice) {
      const credit = oldPrice - newPrice;
      event.registeredUsers.slice(0, -1).forEach(uid => {
        const u = db.users.find(us => us.id === uid);
        if (u) u.wallet += credit;
      });
    }

    let amountToPay = newPrice;
    if (user.wallet > 0) {
      const used = Math.min(user.wallet, newPrice);
      user.wallet -= used; amountToPay -= used;
    }

    const bookingId = `EE${Date.now()}`;
    const qrCode = await QRCode.toDataURL(JSON.stringify({ bookingId, eventId, userId: req.userId }));
    const booking = { id: generateId(db), user: req.userId, event: eventId, amountPaid: amountToPay, qrCode, bookingId, createdAt: new Date() };
    db.bookings.push(booking); saveDB(db);
    res.json({ booking, qrCode, message: 'Booked!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// WALLET
app.get('/api/wallet', auth, async (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.userId);
  res.json({ wallet: user?.wallet || 0 });
});

app.get('/', (req, res) => res.json({ message: '🎉 EventEase Backend Live' }));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
