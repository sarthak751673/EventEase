const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'db.json');

function getDB() {
  if (!fs.existsSync(DB_PATH)) {
    const db = { users: [], events: [], nextId: 1 };
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return db;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

// Seed data matching your Flutter
const db = getDB();
if (db.users.length === 0) {
  db.users.push({ id: 1, email: 'demo@eventease.com', password: 'Demo@1234', name: 'Demo User', wallet: 350 });
  db.events = [
    { id: 1, title: 'Tech Fest 2025', date: 'May 15, 2025', location: 'Mumbai', totalCost: 50000, registered: 38, maxAttendees: 50, color1: '#6C63FF', color2: '#9B59B6', icon: 'computer_rounded', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', description: 'Annual tech festival', tags: ['Technology','Networking'] },
    { id: 2, title: 'Music Night', date: 'May 22, 2025', location: 'Pune', totalCost: 30000, registered: 12, maxAttendees: 30, color1: '#FF6584', color2: '#FF8E53', icon: 'music_note_rounded', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80', description: 'Live music evening', tags: ['Music','Live'] },
    { id: 3, title: 'Startup Summit', date: 'June 1, 2025', location: 'Bangalore', totalCost: 80000, registered: 5, maxAttendees: 100, color1: '#11998E', color2: '#38EF7D', icon: 'rocket_launch_rounded', image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80', description: 'Connect with founders', tags: ['Startup','Business'] },
    { id: 4, title: 'Food Festival', date: 'June 10, 2025', location: 'Delhi', totalCost: 20000, registered: 45, maxAttendees: 60, color1: '#f7971e', color2: '#ffd200', icon: 'restaurant_rounded', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', description: 'Taste cuisines', tags: ['Food','Culture'] },
    { id: 5, title: 'Photography Walk', date: 'June 18, 2025', location: 'Jaipur', totalCost: 8000, registered: 8, maxAttendees: 20, color1: '#4776E6', color2: '#8E54E9', icon: 'camera_alt_rounded', image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80', description: 'Explore Pink City', tags: ['Photography','Travel'] }
  ];
  db.nextId = 6;
  saveDB(db);
}

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'demo@eventease.com' && password === 'Demo@1234') {
    res.status(200).json({ success: true, token: 'demo-token' });
  } else {
    res.status(401).json({ success: false });
  }
});

app.get('/api/events', (req, res) => {
  const db = getDB();
  res.status(200).json(db.events);
});

app.post('/api/register', (req, res) => {
  res.status(200).json({ success: true });
});

app.post('/api/book', (req, res) => {
  const { eventId } = req.body;
  const db = getDB();
  const event = db.events.find(e => e.id === eventId);
  if (event) {
    event.registered++;
    saveDB(db);
    res.status(200).json({ success: true, bookingId: `EE${Date.now()}` });
  } else {
    res.status(400).json({ success: false });
  }
});

app.get('/', (req, res) => res.json({ message: 'EventEase API Live' }));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Running on ${PORT}`));
