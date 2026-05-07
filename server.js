const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'eventease_super_secret_key_2025';

// ==================== DATABASE FUNCTIONS ====================
function getDB() {
  if (!fs.existsSync(DB_PATH)) {
    const db = { users: [], events: [], chats: [], bookings: [], nextId: 1 };
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return db;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ==================== INITIALIZATION - SEED DATA ====================
const db = getDB();

// Seed users if empty
if (db.users.length === 0) {
  db.users = [
    {
      id: 1,
      name: 'Demo User',
      email: 'demo@eventease.com',
      password: bcrypt.hashSync('Demo@1234', 10),
      phone: '+91 9876543210',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      wallet: 350,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Narendra Kanase',
      email: 'narendra@eventease.com',
      password: bcrypt.hashSync('Test@1234', 10),
      phone: '+91 9876543211',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=narendra',
      wallet: 500,
      createdAt: new Date().toISOString()
    }
  ];

  // Seed events
  db.events = [
    {
      id: 1,
      title: 'Tech Fest 2025',
      date: 'May 15, 2025',
      location: 'Mumbai',
      totalCost: 50000,
      registered: 38,
      maxAttendees: 50,
      color1: '#6C63FF',
      color2: '#9B59B6',
      icon: 'computer_rounded',
      image: 'https://via.placeholder.com/300x200?text=Tech+Fest'
    },
    {
      id: 2,
      title: 'Music Night',
      date: 'May 22, 2025',
      location: 'Pune',
      totalCost: 30000,
      registered: 12,
      maxAttendees: 30,
      color1: '#FF6584',
      color2: '#FF8E53',
      icon: 'music_note_rounded',
      image: 'https://via.placeholder.com/300x200?text=Music+Night'
    },
    {
      id: 3,
      title: 'Startup Summit',
      date: 'June 1, 2025',
      location: 'Bangalore',
      totalCost: 80000,
      registered: 5,
      maxAttendees: 100,
      color1: '#11998E',
      color2: '#38EF7D',
      icon: 'rocket_launch_rounded',
      image: 'https://via.placeholder.com/300x200?text=Startup+Summit'
    },
    {
      id: 4,
      title: 'Food Festival',
      date: 'June 10, 2025',
      location: 'Delhi',
      totalCost: 20000,
      registered: 45,
      maxAttendees: 60,
      color1: '#f7971e',
      color2: '#ffd200',
      icon: 'restaurant_rounded',
      image: 'https://via.placeholder.com/300x200?text=Food+Festival'
    },
    {
      id: 5,
      title: 'Photography Walk',
      date: 'June 18, 2025',
      location: 'Jaipur',
      totalCost: 8000,
      registered: 8,
      maxAttendees: 20,
      color1: '#4776E6',
      color2: '#8E54E9',
      icon: 'camera_alt_rounded',
      image: 'https://via.placeholder.com/300x200?text=Photography'
    }
  ];

  db.nextId = 6;
  saveDB(db);
}

// ==================== MIDDLEWARE ====================
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
}

// ==================== AUTHENTICATION ENDPOINTS ====================

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  const db = getDB();
  const user = db.users.find(u => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      wallet: user.wallet,
      profileImage: user.profileImage
    }
  });
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }

  const db = getDB();
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ success: false, message: 'Email already exists' });
  }

  const newUser = {
    id: db.nextId++,
    name,
    email,
    password: bcrypt.hashSync(password, 10),
    phone: phone || '',
    profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    wallet: 0,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB(db);

  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    success: true,
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      wallet: newUser.wallet
    }
  });
});

// ==================== PROFILE ENDPOINTS (ISSUES #1 & #2) ====================

// Get Profile - Shows "Hello {User Name}"
app.get('/api/profile', verifyToken, (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      wallet: user.wallet,
      createdAt: user.createdAt
    }
  });
});

// Update Profile - Dynamic Profile Updates
app.put('/api/profile', verifyToken, (req, res) => {
  const { name, phone, profileImage } = req.body;
  const db = getDB();
  const user = db.users.find(u => u.id === req.userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Update fields
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (profileImage) user.profileImage = profileImage;

  saveDB(db);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      wallet: user.wallet
    }
  });
});

// ==================== EVENTS ENDPOINTS ====================

// Get All Events
app.get('/api/events', (req, res) => {
  const db = getDB();
  res.status(200).json({ success: true, events: db.events });
});

// Get Event Details
app.get('/api/events/:id', (req, res) => {
  const db = getDB();
  const event = db.events.find(e => e.id === parseInt(req.params.id));

  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  res.status(200).json({ success: true, event });
});

// ==================== BOOKING ENDPOINTS ====================

// Book Event
app.post('/api/book', verifyToken, (req, res) => {
  const { eventId } = req.body;
  const db = getDB();
  const event = db.events.find(e => e.id === eventId);
  const user = db.users.find(u => u.id === req.userId);

  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  if (event.registered >= event.maxAttendees) {
    return res.status(400).json({ success: false, message: 'Event is full' });
  }

  if (!user || user.wallet < 100) {
    return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
  }

  event.registered++;
  user.wallet -= 100;

  const booking = {
    id: `EE${Date.now()}`,
    userId: user.id,
    eventId: event.id,
    eventTitle: event.title,
    bookingDate: new Date().toISOString(),
    status: 'confirmed'
  };

  db.bookings.push(booking);
  saveDB(db);

  res.status(200).json({
    success: true,
    message: 'Event booked successfully',
    bookingId: booking.id,
    remainingWallet: user.wallet
  });
});

// Get My Bookings
app.get('/api/my-bookings', verifyToken, (req, res) => {
  const db = getDB();
  const bookings = db.bookings.filter(b => b.userId === req.userId);

  res.status(200).json({ success: true, bookings });
});

// ==================== AI CHATBOT ENDPOINTS (ISSUE #3) ====================

// Chat with Bot
app.post('/api/chat', verifyToken, (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Message required' });
  }

  const db = getDB();
  const user = db.users.find(u => u.id === req.userId);

  // AI Bot Intelligence
  let botResponse = '';
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('event') || lowerMsg.includes('what')) {
    botResponse = `We have ${db.events.length} amazing events! Check out: ${db.events.map(e => e.title).join(', ')}. Which interests you?`;
  } else if (lowerMsg.includes('book') || lowerMsg.includes('register') || lowerMsg.includes('how')) {
    botResponse = 'To book an event: 1) Browse available events 2) Click "Book Now" 3) Confirm with your wallet balance. Need help?';
  } else if (lowerMsg.includes('wallet') || lowerMsg.includes('balance')) {
    botResponse = `Your current wallet balance is ₹${user.wallet}. You can add more funds or use it to book events!`;
  } else if (lowerMsg.includes('location') || lowerMsg.includes('where')) {
    botResponse = `Our events are in: Mumbai, Pune, Bangalore, Delhi, and Jaipur. Which location interests you?`;
  } else if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
    botResponse = `Hello ${user.name}! 👋 Welcome to EventEase. How can I help you today? Ask about events, bookings, or anything else!`;
  } else {
    botResponse = 'I understand you want to know about: ' + message + '. I can help with event queries, bookings, wallet info, and more. What would you like?';
  }

  // Save to chat history
  const chat = {
    id: db.nextId++,
    userId: req.userId,
    userMessage: message,
    botResponse: botResponse,
    timestamp: new Date().toISOString()
  };

  db.chats.push(chat);
  saveDB(db);

  res.status(200).json({
    success: true,
    userMessage: message,
    botResponse: botResponse,
    timestamp: chat.timestamp
  });
});

// Get Chat History
app.get('/api/chat-history', verifyToken, (req, res) => {
  const db = getDB();
  const chats = db.chats.filter(c => c.userId === req.userId);

  res.status(200).json({
    success: true,
    chats: chats.map(c => ({
      userMessage: c.userMessage,
      botResponse: c.botResponse,
      timestamp: c.timestamp
    }))
  });
});

// ==================== HEALTH CHECK ====================
app.get('/', (req, res) => {
  res.json({
    message: '🎉 EventEase Backend API Live',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      auth: ['/api/auth/login', '/api/auth/register'],
      profile: ['/api/profile'],
      events: ['/api/events', '/api/events/:id'],
      bookings: ['/api/book', '/api/my-bookings'],
      chatbot: ['/api/chat', '/api/chat-history']
    }
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║   🎉 EventEase Backend Started!        ║`);
  console.log(`║   📍 Running on port ${PORT}              ║`);
  console.log(`║   ✅ All endpoints ready               ║`);
  console.log(`║   🔐 JWT Authentication enabled        ║`);
  console.log(`║   💬 AI Chatbot active                 ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});

module.exports = app;
