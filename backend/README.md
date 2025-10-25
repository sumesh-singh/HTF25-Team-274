# SkillSync Backend API

A comprehensive Node.js/Express backend for the SkillSync peer-to-peer learning platform.

## Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens, OAuth integration
- **Real-time Communication**: Socket.io for messaging, notifications, and live updates
- **Skills Management**: Hierarchical skill taxonomy with verification system
- **Session Management**: Video session booking, scheduling, and lifecycle management
- **Credit System**: Virtual currency with Stripe payment integration
- **AI-Powered Matching**: Multi-dimensional algorithm for user matching
- **Comprehensive API**: RESTful endpoints for all platform features

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for sessions and real-time features
- **Authentication**: JWT tokens with bcrypt password hashing
- **Real-time**: Socket.io with Redis adapter
- **Payments**: Stripe integration
- **File Upload**: Multer with virus scanning
- **Email**: SendGrid for transactional emails
- **Testing**: Jest with Supertest
- **Logging**: Winston for structured logging

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. **Clone and setup**:

   ```bash
   cd backend
   npm install
   ```

2. **Environment configuration**:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start services with Docker**:

   ```bash
   # From project root
   docker-compose up postgres redis -d
   ```

4. **Database setup**:

   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

### Production Deployment

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Start with Docker Compose**:
   ```bash
   docker-compose --profile production up -d
   ```

## API Documentation

### Base URL

- Development: `http://localhost:3001/api/v1`
- Production: `https://api.skillsync.com/api/v1`

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "abc123"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "abc123"
  }
}
```

### Core Endpoints

#### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

#### Users

- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update user profile
- `GET /users/:id` - Get user by ID
- `DELETE /users/account` - Delete user account

#### Skills

- `GET /skills` - Get all skills
- `GET /skills/categories` - Get skill categories
- `GET /users/:id/skills` - Get user skills
- `POST /users/skills` - Add user skill
- `PUT /users/skills/:id` - Update user skill
- `DELETE /users/skills/:id` - Remove user skill

#### Sessions

- `GET /sessions` - Get user sessions
- `POST /sessions` - Create new session
- `GET /sessions/:id` - Get session details
- `PUT /sessions/:id` - Update session
- `DELETE /sessions/:id` - Cancel session
- `POST /sessions/:id/join` - Join session
- `POST /sessions/:id/rate` - Rate completed session

#### Messaging

- `GET /conversations` - Get user conversations
- `GET /conversations/:id/messages` - Get conversation messages
- `POST /conversations/:id/messages` - Send message
- `POST /conversations/:id/files` - Upload file to conversation

#### Credits

- `GET /credits/balance` - Get credit balance
- `GET /credits/transactions` - Get transaction history
- `POST /credits/purchase` - Purchase credits

#### Notifications

- `GET /notifications` - Get user notifications
- `PUT /notifications/:id/read` - Mark notification as read
- `PUT /notifications/read-all` - Mark all notifications as read

## Development

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── prisma/          # Database schema and migrations
└── tests/           # Test files
```

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Code Quality

- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **TypeScript**: Type safety
- **Husky**: Git hooks for quality checks

## Environment Variables

See `.env.example` for all required environment variables.

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_REFRESH_SECRET` - Secret for refresh token signing

### Optional Variables

- `REDIS_URL` - Redis connection string (default: redis://localhost:6379)
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `SENDGRID_API_KEY` - SendGrid API key for emails
- `STRIPE_SECRET_KEY` - Stripe secret key for payments

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
