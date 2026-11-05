# Dish Booking System with Multi-Role Access & Password Reset

A robust, production-grade RESTful backend system for a Dish Booking Platform featuring **Multi-Role Access Control (Admin, Chef, User)**, **automatic random chef assignment**, **real-time order lifecycle tracking**, **Nodemailer email dispatch on delivery**, **secure password reset**, and **interactive Swagger API documentation**.

Built using **Node.js**, **Express.js**, **MongoDB (Mongoose)**, **JWT Authentication**, **Bcrypt.js**, and **Swagger UI**.

---

## 📌 Problem Statement & Objective

The objective of this project is to develop an end-to-end dish booking platform fulfilling the following requirements:

1. **User Authentication (Signup & Login):**
   - User registration with email, password, name, and role.
   - Salted password hashing using `bcryptjs` (10 rounds).
   - Stateless session token generation using **JSON Web Tokens (JWT)**.
2. **Role-Based Access Control (RBAC):**
   - **Admin:** Can perform full CRUD operations on dishes (`/api/dishes`).
   - **User:** Can place orders and manage their own dish orders (`/api/orders`).
     - Initial status set strictly to `"Order Received"`.
     - Automatically assigned to a random registered chef!
   - **Chef:** Can update order progress lifecycle (`/api/orders/:id/status`):
     - `Preparing`
     - `Out for Delivery`
     - `Delivered`
     - **Email Notification:** When an order is updated to `Delivered`, an email notification is automatically dispatched to the customer containing order details, itemized dishes, total price, delivery address, and timestamp.
3. **Forgot & Reset Password Feature:**
   - User can request a password reset (`/api/auth/forgot-password`).
   - Secure crypto token generated with a 15-minute expiration time.
   - Password reset link dispatched via email.
   - User sets a new password via `/api/auth/reset-password/:token`.
4. **Interactive Swagger API Documentation:**
   - Complete OpenAPI 3.0 specification available at `/api-docs` with "Try it out" interactive testing.
5. **Zero-Config Portability:**
   - Seamlessly connects to local MongoDB (`mongodb://127.0.0.1:27017/dish_booking_db`) or MongoDB Atlas.
   - If no MongoDB daemon is running locally, it automatically falls back to an embedded in-memory database so tests and execution never fail!

---

## 🏗️ Architecture & Project Structure

```
dish-booking-system/
├── .env.example                     # Sample environment configurations
├── .env                             # Local environment variables
├── package.json                     # Project scripts and dependencies
├── README.md                        # Documentation and setup guide
├── docs/
│   └── swagger.json                 # Complete OpenAPI 3.0 API Specification
├── src/
│   ├── app.js                       # Express app configuration & middleware
│   ├── server.js                    # Server bootstrapper & listener
│   ├── seed.js                      # Seed script with realistic demo data
│   ├── config/
│   │   └── db.js                    # MongoDB connection with zero-config fallback
│   ├── models/
│   │   ├── User.js                  # User schema with bcrypt & reset token methods
│   │   ├── Dish.js                  # Dish schema with pricing, category & validation
│   │   └── Order.js                 # Order schema with random chef assignment & items
│   ├── middlewares/
│   │   ├── auth.js                  # JWT verification middleware
│   │   ├── rbac.js                  # Granular role authorization middleware
│   │   └── errorHandler.js          # Centralized error & 404 handler
│   ├── controllers/
│   │   ├── authController.js        # Signup, Login, Forgot & Reset Password
│   │   ├── dishController.js        # Admin Dish CRUD operations
│   │   └── orderController.js       # User order creation & Chef status updates
│   ├── routes/
│   │   ├── authRoutes.js            # Auth routes (/api/auth)
│   │   ├── dishRoutes.js            # Dish routes (/api/dishes)
│   │   └── orderRoutes.js           # Order routes (/api/orders)
│   └── utils/
│       └── emailService.js          # Nodemailer email dispatcher (Reset & Delivery alert)
└── tests/
    ├── setup.js                     # In-memory test database runner
    ├── auth.test.js                 # Auth, JWT, and Password Reset tests
    ├── dishes.test.js               # Admin Dish CRUD & RBAC protection tests
    └── orders.test.js               # Order placement, random chef, and delivery email tests
```

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- *(Optional)* Local MongoDB or MongoDB Atlas URI (if not installed, zero-config in-memory database will run automatically!)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
A `.env` file is pre-configured. You can customize settings if desired:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/dish_booking_db
JWT_SECRET=dish_booking_jwt_secret_token_secure_key_2026
JWT_EXPIRES_IN=7d
RESET_PASSWORD_EXPIRES_MINUTES=15
CLIENT_URL=http://localhost:5000

# Optional: Real SMTP credentials (defaults to Ethereal/Console preview if empty)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
```

### 4. Populate Database with Demo Data
Run the seeding script to create demo Admin, Chefs, Users, Dishes, and Orders:
```bash
npm run seed
```

### 5. Start the Server
Development mode (auto-reload via nodemon):
```bash
npm run dev
```
Standard production start:
```bash
npm start
```

The server will be running at:
- **API Base URL:** `http://localhost:5000`
- **Interactive Swagger Documentation:** `http://localhost:5000/api-docs`
- **Health Check:** `http://localhost:5000/health`

---

## 🧪 Automated Testing (100% Pass Rate)

Run the automated test suite with Jest:
```bash
npm test
```
All **26 unit and integration test cases** pass across 3 test suites:
- `tests/auth.test.js`: Signup, login, bcrypt password hashing, JWT verification, forgot password, token generation, and password reset.
- `tests/dishes.test.js`: Admin-only dish creation, public menu browsing, admin update, admin delete, and regular user 403 Forbidden checks.
- `tests/orders.test.js`: User order placement, automatic initial `"Order Received"` status, random chef assignment, user order modification rules, chef status progression (`Preparing` ➔ `Out for Delivery` ➔ `Delivered`), and email delivery notification trigger with complete order details.

---

## 👥 Seed Test Accounts

| Role | Email | Password | Description |
|---|---|---|---|
| **Admin** | `admin@dishbooking.com` | `password123` | Full CRUD permissions on dishes & orders |
| **Chef 1** | `chef.vikram@dishbooking.com` | `password123` | Can view assigned orders and update statuses |
| **Chef 2** | `chef.anita@dishbooking.com` | `password123` | Can view assigned orders and update statuses |
| **User 1** | `aarav@example.com` | `password123` | Can order dishes, update and cancel own orders |
| **User 2** | `priya@example.com` | `password123` | Can order dishes, update and cancel own orders |

---

## 📖 API Endpoints Reference

### 1. Authentication & Password Reset (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register new user (`role`: `user`, `chef`, `admin`) |
| `POST` | `/api/auth/login` | Public | Login with email & password, returns JWT token |
| `GET` | `/api/auth/me` | Protected | Get profile of currently logged-in user |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset token dispatched via email |
| `POST` | `/api/auth/reset-password/:token` | Public | Reset password using secret token |

### 2. Dishes Management (`/api/dishes`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dishes` | Public | List all dishes (filters: `category`, `search`, `available`) |
| `GET` | `/api/dishes/:id` | Public | Get single dish by ID |
| `POST` | `/api/dishes` | **Admin Only** | Create a new dish |
| `PUT` | `/api/dishes/:id` | **Admin Only** | Update dish details |
| `DELETE` | `/api/dishes/:id` | **Admin Only** | Delete a dish |

### 3. Orders & Chef Status (`/api/orders`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders` | **User Only** | Place an order (Status: `"Order Received"`, randomly assigns a chef) |
| `GET` | `/api/orders` | Protected | User sees own orders; Chef sees assigned orders; Admin sees all |
| `GET` | `/api/orders/:id` | Protected | View single order details (Owner, Chef, or Admin) |
| `PUT` | `/api/orders/:id` | **User Only** | Update own order (Allowed while in `"Order Received"` status) |
| `DELETE` | `/api/orders/:id` | **User Only** | Cancel/delete own order (Allowed before delivery) |
| `PATCH` | `/api/orders/:id/status` | **Chef / Admin** | Update status (`Preparing`, `Out for Delivery`, `Delivered`). **Triggers email notification on `Delivered`!** |

---

## 📧 Email Notification Details

When a chef updates an order's status to **`Delivered`**, the system automatically dispatches an HTML and plain-text confirmation email to the customer's email address with:
- Order ID & Delivery timestamp
- Assigned chef name
- Itemized list of all dishes, quantities, and prices
- Total amount paid
- Delivery address

*(In development, preview URLs are generated via Nodemailer Ethereal and logged directly to the console for inspection without needing live SMTP keys!)*

---

## 👨‍💻 Author
**Satyajit Vala**  
*Computer Engineering / Information Technology*
