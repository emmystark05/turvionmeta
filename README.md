# TurvionMeta  Educational Trading Platform

A fully functional, client-side trading platform built with vanilla HTML5, CSS3, and JavaScript. No backend required. Perfect for learning web development patterns and financial dashboard design.

## 📋 Quick Start

### 1. **First Time Setup**
- Open `index.html` in your browser
- The system auto-initializes with an admin account
- **Admin Credentials:** `admin@stark` / `stark`

### 2. **Sign Up**
- Navigate to **Sign Up** page
- Fill in: Full Name, Email, Phone, Password
- Account created with sample portfolio (BTC, ETH, USDT, SOL, XRP, ADA, BNB, DOGE, AVAX, LINK)

### 3. **Login**
- Enter your **Email/Phone** and **Password**
- Password validation is required (enhanced security)
- Access your portfolio dashboard

### 4. **Admin Panel** (Optional)
- Login with admin credentials
- Enter admin password: `stark` (password gate)
- View all registered users and their portfolios
- Read-only mode for price editing (gated for educational security)

---

## 📁 Project Structure

```
brokerPage/
├── index.html              # Landing page & entry point
├── init.js                 # One-time app initialization (creates admin account)
├── README.md              # This file
├── user.html              # Protected portfolio dashboard
├── admin.html             # Protected admin panel
│
└── login/
    ├── login.html         # Login page with email/password form
    ├── signup.html        # Registration page
    ├── script.js          # Login logic & password validation
    ├── signup-script.js   # Registration & user creation
    └── style.css          # All styling for login/signup pages
```

---

##  Authentication System

### User Registration Flow
1. User fills signup form (name, email, phone, password)
2. Validation checks performed on all fields
3. Unique User ID generated (timestamp + random string)
4. User object created with empty portfolio
5. User stored in `localStorage['tradeflexUsers']` array

### User Login Flow
1. User enters email/phone **AND** password
2. System finds user by email/phone match
3. **Password validation**  stored password must match input password
4. If valid, user data stored in `localStorage['currentUser']`
5. Redirect to `user.html` dashboard

### User Object Structure
```javascript
{
  id: "USER_1702123456_abc123",
  fullName: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  password: "securePass123",      // Plain text (educational purpose)
  createdAt: "2024-01-02T10:30:00Z",
  portfolio: {                    // Holdings in units (not USD value)
    BTC: 0.15,
    ETH: 2.5,
    USDT: 1000,
    SOL: 50,
    XRP: 500,
    ADA: 200,
    BNB: 1.5,
    DOGE: 2000,
    AVAX: 10,
    LINK: 25
  },
  totalValue: 24810,              // USD value of portfolio
  status: "active"
}
```

---

## 👤 User Dashboard (`user.html`)

**Protected route:** Redirects to login if not authenticated

### Features
- **Portfolio Stats**  Total value, 24h change, best performer, position count
- **Live Ticker**  Real-time price updates (simulated via JavaScript)
- **Chart Selector**  Toggle which coins display charts
- **Price Charts**  Canvas-based OHLC candlestick charts
- **Holdings Table**  Live position tracking with allocation bars
- **Modal Viewer**  Click any chart to open detailed modal with OHLC data

### Session Protection
```javascript
// On page load, checks for currentUser
if (!currentUser) redirect to login
```

---

## 🏢 Admin Panel (`admin.html`)

**Double-protected route:**
1. Email must be `admin@stark` (checked on load)
2. Admin password required: `stark` (modal gate on entry)

### Features
- **Admin Auth Modal**  Password gate on every admin session
- **User Table**  All registered users with avatars, status, portfolio values
- **Search & Filter**  Filter by name, email, or status (active/pending/flagged)
- **Sparkline Charts**  Performance visualization per user
- **Stats Cards**  Total users, platform AUM, coins tracked, flagged accounts
- **Ticker**  Real-time price feed

### Admin User Object
```javascript
{
  id: "ADMIN_000",
  fullName: "Admin User",
  email: "admin@stark",
  phone: "+1234567890",
  password: "stark",
  status: "active",
  portfolio: { /* full holdings */ }
}
```

---

## 💾 Data Storage (localStorage)

All data persists in browser's localStorage:

| Key | Type | Purpose |
|-----|------|---------|
| `tradeflexUsers` | Array | All registered users |
| `currentUser` | Object | Logged-in user data |
| `appInitialized` | Boolean | Tracks first-time setup |
| `adminAuthenticated` | Boolean | Admin session gate |

### View Data in Browser
1. Open DevTools: `F12` or `Cmd+Option+I`
2. Go to **Application** tab → **Local Storage**
3. Inspect `tradeflexUsers` array and `currentUser` object

---

## 🔄 Price Updates & Charts

### Simulated Price Movement
- Prices update every 500ms
- Random volatility applied: ±0.1% per tick
- OHLC data generated from price movement
- Candlestick charts rendered in real-time

### Chart Data Structure
```javascript
const cdata = {
  BTC: [
    { o: 67400, h: 67520, l: 67300, c: 67450 },  // OHLC for each timeframe
    // ...more candles
  ],
  // ...other coins
}
```

### Available Coins
- **BTC**  Bitcoin ($67,420)
- **ETH**  Ethereum ($3,510)
- **USDT**  Tether ($1.00)
- **BNB**  Binance ($594)
- **SOL**  Solana ($172)
- **XRP**  Ripple ($0.62)
- **ADA**  Cardano ($0.58)
- **DOGE**  Dogecoin ($0.17)
- **AVAX**  Avalanche ($38.90)
- **LINK**  Chainlink ($14.20)

---

## 🎨 Design System

### Color Palette
- **Primary Blue:** `#1068eb` (brand, interactive elements)
- **Success Green:** `#059669` (gains, live indicators)
- **Danger Red:** `#dc2626` (losses, errors)
- **Background:** `#f8fafc` (light mode)
- **Surface:** `#ffffff` (cards, modals)
- **Text:** `#0f172a` (primary), `#475569` (secondary)

### Typography
- **Headings:** Sora (400, 600, 700 weights)
- **Monospace:** IBM Plex Mono (data, prices)

### Spacing Tokens
- Used minimal token approach for efficient CSS
- Based on 4px grid system
- Responsive breakpoints: 900px, 640px

---

## 🔧 Technical Details

### Tech Stack
- **HTML5**  Semantic markup
- **CSS3**  Flexbox/Grid, animations, media queries
- **JavaScript (Vanilla)**  No dependencies or frameworks
- **Canvas API**  Charts & visualizations
- **localStorage API**  Data persistence

### Key Functions

#### `handleLogin()`  Login validation
- Gets email/phone and password
- Finds user in localStorage
- Validates password match
- Sets currentUser on success

#### `handleSignup()`  User registration
- Validates all form fields
- Generates unique user ID
- Creates user object
- Stores in localStorage.tradeflexUsers

#### `verifyAdminPassword()`  Admin gate
- Checks password against hardcoded `stark`
- Sets adminAuthenticated flag
- Allows table rendering

#### `buildTable()`  Dynamic table rendering
- Loops through user data
- Creates table rows with avatars
- Generates sparkline charts
- Updates user count

#### `loop()`  Price update loop
- Runs every 500ms
- Updates all coin prices with volatility
- Redraws candlestick charts
- Updates ticker display

---

## 🎓 Educational Purpose

This project demonstrates:
-  Form validation & error handling
-  Password-based authentication (client-side)
-  Protected routes & session management
-  Dynamic DOM manipulation
-  Canvas charting & data visualization
-  localStorage for client-side persistence
-  Responsive design patterns
-  Real-time data simulation
-  Modal dialogs & overlays
-  Professional UI/UX patterns

---

## Important Notes

### Security Disclaimer
- **Not production-ready**  Passwords stored in plain text
- **Client-side only**  No backend encryption/verification
- **Educational purposes**  Demonstrates concepts, not best practices
- For real applications, implement proper backend authentication with:
  - Hashed passwords (bcrypt, PBKDF2)
  - JWT tokens
  - HTTPS encryption
  - Session tokens
  - Rate limiting

### Data Persistence
- Data only persists in this browser (localStorage)
- Clearing browser cache wipes all data
- To reset, clear localStorage and refresh

### Cross-Device
- Each device/browser has separate accounts
- No cloud sync or backup
- Perfect for single-device testing

---

## 🚀 Next Steps / Enhancements

Consider adding:
- [ ] Backend API integration (Node.js/Express)
- [ ] Real cryptocurrency APIs (CoinGecko, Binance)
- [ ] PostgreSQL database
- [ ] User profile customization
- [ ] Transaction history
- [ ] Export to CSV/PDF
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)
- [ ] Email verification
- [ ] Two-factor authentication

---

## 📖 File-by-File Guide

### `index.html`
- Landing page with welcome message
- Displays admin credentials for learning
- Navigation to signup/login/admin

### `init.js`
- Runs on first page load
- Creates admin user account
- Sets `appInitialized` flag
- Only executes once

### `login/login.html`
- Split form: email/phone + password
- Error message display for failed authentication
- Mobile responsive with hamburger menu
- Links to signup page

### `login/signup.html`
- 4-field registration form
- Terms checkbox required
- Password input field
- Link to login page

### `login/script.js`
- `handleLogin()`  Email + password validation
- Hamburger menu animation
- Slide carousel (3 slides auto-rotating)
- Enter key handling

### `login/signup-script.js`
- `handleSignup()`  Complete validation
- Email regex validation
- Phone validation
- User object creation
- localStorage persistence

### `user.html`
- Responsive portfolio dashboard
- Protected route (redirects if not logged in)
- All styling integrated in single file
- Modern, professional design

### `admin.html`
- Responsive admin dashboard
- Double-protected (email + password)
- User management table
- Real-time stats
- All styling integrated

---

## 💡 Tips for Learning

1. **Inspect the browser console**  See price updates in real-time
2. **Open DevTools → Storage**  Watch localStorage update
3. **Try multiple accounts**  Test user isolation
4. **Modify prices in code**  See charts update
5. **Read the JavaScript carefully**  Notice patterns like event delegation

---

## 📞 Support

For questions or improvements, refer to the inline code comments in:
- `login/script.js`  Auth logic
- `user.html`  Dashboard logic
- `admin.html`  Admin panel logic

---

**Built with ❤️ for learning. © TurvionMeta Educational Platform**
# turvionmeta
# turvionmeta
