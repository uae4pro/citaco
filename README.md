# AutoParts Store - Complete E-commerce Application

A full-stack spare parts e-commerce application built with React frontend and Node.js/Express backend, using PostgreSQL database.

## 🚀 Features

- **Product Catalog**: Browse spare parts by category, brand, and price
- **Search & Filter**: Advanced search and filtering capabilities
- **Shopping Cart**: Add/remove items, quantity management
- **Order Management**: Complete order processing workflow
- **User Authentication**: Registration, login, profile management
- **Admin Dashboard**: Inventory management, order tracking, user management
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## 🛠 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Radix UI** - Component library
- **React Router** - Client-side routing
- **Framer Motion** - Animations
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Joi** - Input validation
- **Helmet** - Security middleware

## 📁 Project Structure

```
├── src/                    # Frontend React application
│   ├── api/               # API client and entity definitions
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── data/             # Mock data (legacy)
│   └── utils/            # Utility functions
├── server/               # Backend API server
│   ├── config/          # Database configuration
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── scripts/         # Database scripts
├── database/            # Database schema and seed files
├── .env                # Environment variables
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Environment Setup

The `.env` file is already configured with your PostgreSQL connection.

### 3. Initialize Database

```bash
# Initialize database schema and seed data
cd server
npm run init-db
```

### 4. Start the Application

```bash
# Terminal 1: Start the backend server
cd server
npm run dev

# Terminal 2: Start the frontend development server
cd ..
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health# citaco
