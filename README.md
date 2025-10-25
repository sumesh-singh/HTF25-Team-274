# SkillSync Platform

A comprehensive peer-to-peer learning exchange platform that connects users who want to teach or learn specific skills through AI-powered matching, structured sessions, gamified credit economy, and community-driven learning experiences.

## 🚀 Features

- **AI-Powered Matching**: Multi-dimensional algorithm for intelligent user connections
- **Real-time Communication**: Instant messaging with file sharing and typing indicators
- **Video Sessions**: Integrated video calling with Zoom/Daily.co APIs
- **Credit Economy**: Virtual currency system with Stripe payment integration
- **Skill Verification**: Community-validated skill certifications
- **Learning Circles**: Group learning sessions for collaborative skill development
- **Mobile-First Design**: Responsive PWA with offline capabilities

## 🏗️ Architecture

### Frontend

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Socket.io** for real-time features

### Backend

- **Node.js** with Express.js and TypeScript
- **PostgreSQL** with Prisma ORM
- **Redis** for caching and sessions
- **Socket.io** for real-time communication
- **JWT** authentication with refresh tokens

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/HTF25-Team-274.git
   cd HTF25-Team-274
   ```

2. **Start infrastructure services**:

   ```bash
   docker-compose up postgres redis -d
   ```

3. **Setup Backend**:

   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run db:generate
   npm run db:push
   npm run db:seed
   npm run dev
   ```

4. **Setup Frontend**:

   ```bash
   cd ../
   npm install
   npm run dev
   ```

5. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - API Health: http://localhost:3001/health

## 📁 Project Structure

```
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema
│   └── tests/              # Backend tests
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom hooks
│   └── layouts/            # Layout components
├── .kiro/specs/            # Project specifications
└── docker-compose.yml     # Development services
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm test -- --coverage    # With coverage
```

### Frontend Tests

```bash
npm test                   # Run frontend tests
```

## 📚 API Documentation

The backend API provides comprehensive endpoints for:

- **Authentication**: Registration, login, OAuth, password reset
- **User Management**: Profiles, skills, availability
- **Sessions**: Booking, scheduling, video integration
- **Messaging**: Real-time chat with file sharing
- **Credits**: Virtual currency and payments
- **Matching**: AI-powered user recommendations
- **Notifications**: Multi-channel delivery system

See [Backend README](./backend/README.md) for detailed API documentation.

## 🔧 Development

### Available Scripts

**Frontend**:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Backend**:

- `npm run dev` - Start development server
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run db:migrate` - Run database migrations

### Environment Variables

Copy `.env.example` files and configure:

- Database connections
- JWT secrets
- API keys (Stripe, SendGrid, etc.)
- OAuth credentials

## 🚀 Deployment

### Production Build

```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build

# Start with Docker Compose
docker-compose --profile production up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

## GitHub submission guide

In this Readme, you will find a guide on how to fork this Repository, add files to it, and make a pull request to contribute your changes.

<details open>
<summary><h3>1. Login to your GitHub Account</h3></summary>
<br>
<p>Go to <a href="https://github.com">github.com</a> to log in.</p>
<ul>
   <li>Open the <a href="https://github.com/cbitosc/HTF25-Team-274">current repo</a> in a new tab.</li>
   <li>Perform all operations in the newly opened tab, and follow the current tab for instructions.</li>
</ul>
</details>

<details open>
<summary><h3>2. Fork the Repository</h3></summary>
<br>
<p align="center">
  <img src="fork.jpeg" alt="Fork the Repository" height="300">
</p>
<ul>
 <li>In the newly opened tab, on the top-right corner, click on <b>Fork</b>.</li>
 <li>Enter the <b>Repository Name</b> as <b>HTF25-Team-274</b>.</li>
 <li>Then click <b>Create Fork</b>, leaving all other fields as default.</li>
 <li>After a few moments, you can view your forked repo.</li>
</ul>
</details>

<details open>
<summary><h3>3. Clone your Repository</h3></summary>
<br>
<ul>
 <li>Click on <b>Code</b> and copy the <b>web URL</b> of your forked repository.</li>
 <li>Open terminal on your local machine.</li>
 <li>Run this command to clone the repo:</li>
<pre><code>git clone https://github.com/your-username/HTF25-Team-274.git</code></pre>
</ul>
</details>

<details open>
<summary><h3>4. Adding files to the Repository</h3></summary>
<br>
<ul>
 <li>While doing it for the first time, create a new branch for your changes:</li>
<pre><code>git checkout -b branch-name</code></pre>
 <li>Add files or modify existing ones.</li>
 <li>Stage your changes:</li>
<pre><code>git add .</code></pre>
 <li>Commit your changes:</li>
<pre><code>git commit -m "Descriptive commit message"</code></pre>
 <li>Push your branch to your fork:</li>
<pre><code>git push origin branch-name</code></pre>
</ul>
</details>

<details open>
<summary><h3>5. Create a Pull Request</h3></summary>
<br>
<ul>
 <li>Click on the <b>Contribute</b> button in your fork and choose <b>Open Pull Request</b>.</li>
 <li>Leave all fields as default, then click <b>Create Pull Request</b>.</li>
 <li>Wait a few moments; your PR is now submitted.</li>
</ul>
</details>

## Thanks for participating!
