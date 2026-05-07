# 🎉 EventEase Backend API

**Production-ready Node.js + Express backend** for the EventEase event management platform.

## ✨ Features Implemented

### ✅ Issue #1: "Hello User" - Dynamic Name Display
- **Endpoint**: `GET /api/profile`
- Returns logged-in user's name (e.g., "Narendra Kanase")
- Frontend displays: "Hello Narendra Kanase! 👋"

### ✅ Issue #2: Dynamic Profile (Narendra Kanase)
- **Endpoints**: 
  - `GET /api/profile` - Fetch profile
  - `PUT /api/profile` - Update name, phone, image dynamically
- Profile updates in real-time without page refresh

### ✅ Issue #3: AI Chatbot
- **Endpoints**:
  - `POST /api/chat` - Send message, get smart response
  - `GET /api/chat-history` - Retrieve conversation
- Smart responses for: events, bookings, wallet, locations, registration help

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally
```bash
npm start
```
Backend runs on `http://localhost:5000`

### 3. Test Endpoints

**Login with Narendra:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"narendra@eventease.com","password":"Test@1234"}'
```

**Get Profile (Issue #1 - Shows "Hello {name}"):**
```bash
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Update Profile (Issue #2 - Dynamic):**
```bash
curl -X PUT http://localhost:5000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name","phone":"+91 9999999999"}'
```

**Chat with Bot (Issue #3):**
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"What events do you have?"}'
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user

### Profile (FIXED ISSUES #1 & #2)
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile dynamically

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event details

### Bookings
- `POST /api/book` - Book an event
- `GET /api/my-bookings` - Get user bookings

### Chatbot (FIXED ISSUE #3)
- `POST /api/chat` - Send message to AI bot
- `GET /api/chat-history` - Get chat history

## 🔐 Test Credentials

| User | Email | Password |
|------|-------|----------|
| Narendra | narendra@eventease.com | Test@1234 |
| Demo | demo@eventease.com | Demo@1234 |

## 🌐 Deploy to Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
vercel
```

### 3. Add Environment Variable
Go to Vercel dashboard → Select project → Settings → Environment Variables
- Add `JWT_SECRET=eventease_super_secret_key_2025`

### 4. Redeploy
```bash
vercel --prod
```

## 🧪 Test on Vercel

Replace `YOUR_VERCEL_URL` with your deployment URL:

```bash
# Login
curl -X POST https://YOUR_VERCEL_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"narendra@eventease.com","password":"Test@1234"}'

# Get Profile
curl -X GET https://YOUR_VERCEL_URL/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📦 Dependencies

- `express` - Web framework
- `cors` - Cross-origin requests
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `dotenv` - Environment variables

## 📱 Mobile App Integration

Update your frontend API URL to:
```javascript
const API_URL = 'https://YOUR_VERCEL_URL';
```

Then build Android APK with React Native/Expo.

## ✅ What's Fixed

1. ✅ **"Hello User"** → Now shows dynamic user name
2. ✅ **"Narendra Kanase"** → Profile is fully editable
3. ✅ **AI Chatbot** → Smart responses, conversation history

All issues resolved and production-ready! 🎉
