#!/bin/bash

# AutoParts Store Setup Script
echo "🚀 Setting up AutoParts Store..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_success "npm $(npm -v) detected"

# Install frontend dependencies
print_status "Installing frontend dependencies..."
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd server
if npm install; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create it with your database configuration."
    exit 1
fi

print_success ".env file found"

# Initialize database
print_status "Initializing database..."
cd server
if npm run init-db; then
    print_success "Database initialized successfully"
else
    print_warning "Database initialization failed. You may need to run this manually."
fi
cd ..

print_success "Setup completed successfully!"
echo ""
echo "🎉 AutoParts Store is ready to run!"
echo ""
echo "To start the application:"
echo "1. Start the backend server:"
echo "   cd server && npm run dev"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   npm run dev"
echo ""
echo "The application will be available at:"
echo "- Frontend: http://localhost:5173"
echo "- Backend API: http://localhost:3001"
echo "- Health Check: http://localhost:3001/health"
echo ""
echo "Default admin credentials:"
echo "- Email: admin@autoparts.com"
echo "- Password: (check database seed file)"
echo ""
print_success "Happy coding! 🚗💨"
