🚀 Authentication & API Key System

A complete backend authentication platform featuring JWT-based user authentication, secure API key management, role-based access control, and full Swagger documentation. Built with security, scalability, and developer experience in mind.

✨ Features
🔐 User Authentication
Signup, login, and profile retrieval using JWT
Secure password hashing with bcrypt

🔑 API Key Management
Generate, revoke, and validate API keys
Service-to-service authentication supported
🛂 Role-Based Access Control
User and admin roles
Permission-based endpoint access

🛡️ Security
Bcrypt password hashing
JWT validation
Secure API key generation
Helmet security headers
Input validation & SQL injection protection
Configurable CORS

📘 API Documentation
Full Swagger/OpenAPI documentation with interactive testing
🗄️ Database
PostgreSQL with proper indexing
UUID-based IDs

📦 TypeScript

Fully typed codebase with improved reliability and maintainability

🛠️ Tech Stack
Area	Technology
⚙️ Runtime	Node.js
🧩 Framework	Express.js
🛢️ Database	PostgreSQL (pg driver)
🔐 Authentication	JWT + bcrypt
📘 Documentation	Swagger/OpenAPI
✍️ Language	TypeScript
📌 Prerequisites

Node.js (v16+)
PostgreSQL (v12+)
npm or yarn
📥 Installation
1️⃣ Clone the Repository
git clone <repository-url>
cd auth-api-system
2️⃣ Install Dependencies
npm install
3️⃣ Set Up PostgreSQL
psql -U postgres

CREATE DATABASE auth_system_db;
CREATE USER auth_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE auth_system_db TO auth_user;

\q

4️⃣ Configure Environment Variables
Create .env:
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_system_db
DB_USER=auth_user
DB_PASSWORD=password

JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=24h

API_KEY_PREFIX=sk_
API_KEY_EXPIRES_DAYS=30

BCRYPT_SALT_ROUNDS=12

CORS_ORIGIN=http://localhost:3000

5️⃣ Run Database Setup
npm run db:setup

🏃 Running the Application
▶️ Development Mode
npm run dev

🚀 Production Build
npm run build
npm start

🧨 Reset Database + Start
npm run db:reset && npm run dev

📚 API Documentation
Interactive Swagger Docs:
👉 http://localhost:3000/api-docs
🛠️ API Endpoints
🔐 Authentication
POST /api/v1/auth/signup
Registers a new user.

POST /api/v1/auth/login
Authenticates user and returns JWT.

GET /api/v1/auth/profile
Returns authenticated user profile.

🔑 API Key Management
POST /api/v1/keys/create
Create an API key.

GET /api/v1/keys
List API keys.

DELETE /api/v1/keys/{apiKeyId}/revoke
Revoke an API key.

POST /api/v1/keys/validate
Validate an API key.

GET /api/v1/keys/test
Test API key authentication.

🔐 Authentication Methods
1. JWT Authentication
Authorization: Bearer <jwt_token>
2. API Key Authentication
x-api-key: <api_key>

🗂️ Database Schema
👤 Users Table
(DDL Included)

🔑 API Keys Table
(DDL Included)

🧪 Testing with cURL
Example commands are included for:
✔ Register
✔ Login
✔ Create API Key
✔ Test API Key Authentication

📁 Project Structure
auth-api-system/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── app.ts
│   └── index.ts
├── scripts/
├── uploads/
├── .env
├── package.json
└── README.md

🛡️ Security Features
🔐 Bcrypt password hashing
🎫 JWT with expiration
🔑 API key expiration & prefix
🧹 Input validation
🛡 SQL injection prevention

🌍 CORS protection
🪖 Helmet security headers

⚠️ Error Handling
400 – Bad Request
401 – Unauthorized
403 – Forbidden
404 – Not Found
409 – Conflict
500 – Server Error

⚙️ Environment Variables
A full table is provided including:
Port
DB credentials
JWT configs
API key settings
Bcrypt rounds
CORS origin

🧩 Development Guide
Adding New Features
Create Model
Add Service
Implement Controller
Register Route
Update Swagger
Test thoroughly

🔄 Database Migrations
Recommended:
🧱 node-pg-migrate
🐘 sequelize-cli
⚙️ knex

🛠️ Troubleshooting
Common issues include:
❌ DB connection
❌ Invalid JWT
❌ API key expired
❌ CORS errors
Each includes steps on what to check.

🚢 Deployment
🐳 Docker
Dockerfile included.
♾ PM2
npm run build
pm2 start dist/index.js --name auth-api

🤝 Contributing
Fork
Create feature branch
Submit PR

📄 License
MIT License.

❤️ Acknowledgments
Express.js team
PostgreSQL community
JWT specification contributors
Project supporters
