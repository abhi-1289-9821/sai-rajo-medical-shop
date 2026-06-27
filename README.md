# 🏥 Sai Rajo Medical Shop — Online Medicine Ordering Platform

<div align="center">

![Platform](https://img.shields.io/badge/Platform-Web-blue?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js)
![Database](https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql)
![Deployed](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)

**A full-stack web application for a local medical store that allows customers to place medicine orders online with real-time order tracking and admin management.**

[🌐 Live Demo](https://sai-rajo-medical-shop.vercel.app) • [📦 Backend API](https://sai-rajo-backend.onrender.com/healthz) • [📁 Repository](https://github.com/abhi-1289-9821/sai-rajo-medical-shop)

</div>

---

## 📸 Screenshots

| Customer Order Page | Admin Dashboard |
|---|---|
| Customers fill name, phone, address, medicines | Admin views and manages all orders in real-time |

---

## ✨ Features

### 👤 Customer Side
- 📋 **Place Medicine Orders** — Fill name, phone, address, and list of medicines needed
- 📎 **Upload Prescription** — Attach prescription image (JPG, PNG, PDF, WEBP)
- 🔍 **Track Order Status** — Check order status using order number + phone number
- ⚡ **Real-Time Updates** — Order status updates pushed live via WebSocket (no page refresh needed)

### 🛠️ Admin Side
- 🔐 **Secure Login** — JWT-based authentication for admin access
- 📊 **Live Dashboard** — View all orders with real-time Socket.IO updates
- ✅ **Order Management** — Accept, reject, or mark orders as delivered
- 📲 **Telegram Notifications** — Instant Telegram message when a new order arrives
- 🖼️ **View Prescriptions** — Securely view uploaded customer prescription files

### 🔒 Security
- JWT authentication with HTTP-only handling
- Magic byte file validation (prevents spoofed file type attacks)
- SQL injection prevention via parameterized queries
- Helmet.js for secure HTTP headers
- Rate limiting on API endpoints
- CORS whitelist restricted to known origins

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **React Router v7** | Client-side routing |
| **Socket.IO Client** | Real-time WebSocket connection |
| **Axios** | HTTP API requests |
| **Tailwind CSS** | Utility-first styling |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **Socket.IO** | Real-time bidirectional events |
| **MySQL2** | Database driver with connection pooling |
| **JWT (jsonwebtoken)** | Stateless authentication |
| **Multer** | Prescription file uploads |
| **Cloudinary** | Cloud image storage |
| **Bcryptjs** | Password hashing |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | API rate limiting |
| **Telegram Bot API** | Order push notifications |

### Infrastructure (100% Free)
| Service | Purpose |
|---|---|
| **Vercel** | Frontend hosting |
| **Render** | Backend hosting |
| **Aiven** | Managed MySQL database |
| **Cloudinary** | Prescription image storage |
| **GitHub** | Source control & CI/CD |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Customer Browser                   │
│            React + Vite (Vercel CDN)                │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS REST + WebSocket
                        ▼
┌─────────────────────────────────────────────────────┐
│          Node.js + Express Backend (Render)         │
│  ┌─────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  REST API   │  │ Socket.IO│  │  Telegram Bot │  │
│  │  /api/auth  │  │  Server  │  │  Notifications│  │
│  │  /api/orders│  │          │  │               │  │
│  └──────┬──────┘  └──────────┘  └───────────────┘  │
│         │                                           │
│  ┌──────▼──────────────────────┐                   │
│  │     MySQL Connection Pool   │                   │
│  └──────┬──────────────────────┘                   │
└─────────┼───────────────────────────────────────────┘
          │
    ┌─────▼──────┐      ┌─────────────┐
    │   Aiven    │      │  Cloudinary │
    │   MySQL    │      │  (Images)   │
    └────────────┘      └─────────────┘
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js v18+
- MySQL 8.0+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/abhi-1289-9821/sai-rajo-medical-shop.git
cd sai-rajo-medical-shop
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values (DB credentials, JWT secret, etc.)
npm run seed      # Creates DB tables and default admin user
npm run dev       # Starts backend on http://localhost:5000
```

### 3. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev       # Starts frontend on http://localhost:5173
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=medistore_db
DB_SSL=false
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Admin login | ❌ |

### Orders
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/orders` | Place new order (with optional prescription) | ❌ |
| `GET` | `/api/orders` | Get all orders | ✅ Admin |
| `PATCH` | `/api/orders/:id/status` | Update order status | ✅ Admin |
| `GET` | `/api/orders/:order_number` | Track order by number + phone | ❌ |

### System
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/healthz` | Health check |

---

## 📂 Project Structure

```
sai-rajo-medical-shop/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js          # MySQL connection pool
│   │   │   ├── schema.sql     # Database schema
│   │   │   ├── seed.js        # Admin user seeding
│   │   │   └── socket.js      # Socket.IO configuration
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── orderController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js   # JWT verification
│   │   │   └── errorMiddleware.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── orderRoutes.js
│   │   ├── utils/
│   │   │   └── telegramBot.js
│   │   ├── app.js             # Express app setup
│   │   └── server.js          # HTTP server + Socket.IO + keep-alive
│   └── uploads/               # Local fallback for prescriptions
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── NotificationPopup.jsx  # Real-time order alert
    │   │   └── ProtectedRoute.jsx     # Auth guard
    │   ├── context/
    │   │   ├── AuthContext.jsx         # JWT auth state
    │   │   └── SocketContext.jsx       # WebSocket connection
    │   ├── pages/
    │   │   ├── Home.jsx        # Customer order form
    │   │   ├── Login.jsx       # Admin login
    │   │   └── Dashboard.jsx   # Admin order management
    │   └── main.jsx
    ├── vercel.json             # SPA routing config
    └── vite.config.js
```

---

## 🌐 Deployment

This project is deployed entirely for **free** using:

| Service | URL |
|---|---|
| **Frontend** | https://sai-rajo-medical-shop.vercel.app |
| **Backend** | https://sai-rajo-backend.onrender.com |

### Deploy Your Own (Free)
1. **Database** → [Aiven](https://aiven.io) — Free MySQL
2. **Backend** → [Render](https://render.com) — Free Node.js hosting
3. **Frontend** → [Vercel](https://vercel.com) — Free static hosting
4. **Images** → [Cloudinary](https://cloudinary.com) — Free image CDN

---

## 🧪 Running Tests

```bash
cd backend
npm test                        # Unit tests
npm run test:integration        # Integration tests
```

---

## 👨‍💻 Developer

**Abhinov Kanojiya**
- GitHub: [@abhi-1289-9821](https://github.com/abhi-1289-9821)
- Project: [sai-rajo-medical-shop](https://github.com/abhi-1289-9821/sai-rajo-medical-shop)

---

## 📄 License

This project is built for **Sai Rajo Medical Shop** as a real-world business solution.

---

<div align="center">
  Built with ❤️ | Full-Stack Web Application | React + Node.js + MySQL
</div>
