# my-store

A modern e-commerce platform built with TypeScript, React, and Express.

## ✨ Features

- 🎨 **Modern UI** - Beautiful, responsive design with TailwindCSS 4 and shadcn/ui
- 🌙 **Dark Mode** - Full dark mode support
- ⚡ **Fast** - Built with Vite for lightning-fast development
- 🔒 **Type-Safe** - End-to-end type safety with TypeScript and tRPC
- 📱 **Responsive** - Works seamlessly on all devices
- 🧪 **Well-Tested** - Comprehensive test coverage with Vitest
- 📦 **Monorepo** - Organized codebase with npm workspaces

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm 11.7.0+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd my-store

# Install dependencies
npm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env
cp apps/server/.env.example apps/server/.env

# Update .env files with your configuration
```

### Database Setup

1. Make sure you have a PostgreSQL database running
2. Update `apps/server/.env` with your database connection details
3. Push the schema to your database:

```bash
npm run db:push
```

### Development

```bash
# Start both web and server
npm run dev

# Or start them separately
npm run dev:web      # Frontend only (http://localhost:3001)
npm run dev:server   # Backend only (http://localhost:4001)
```

Open [http://localhost:3001](http://localhost:3001) to see the application.

## 📚 Documentation

- [API Documentation](./docs/API.md) - Complete API reference
- [Architecture](./docs/ARCHITECTURE.md) - System architecture and design decisions
- [Contributing](./CONTRIBUTING.md) - How to contribute to the project

## 🛠️ Available Scripts

### Development
- `npm run dev` - Start both frontend and backend
- `npm run dev:web` - Start frontend only
- `npm run dev:server` - Start backend only

### Testing
- `npm test` - Run all tests
- `npm run test:coverage` - Run tests with coverage report

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run check-types` - Run TypeScript type checking

### Database
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:migrate:all` - Chạy tất cả migrations (file all_migrations.sql duy nhất)
- `npm run db:start` - Start local PostgreSQL (Docker)
- `npm run db:stop` - Stop local PostgreSQL

### Build
- `npm run build` - Build all workspaces for production

## 📁 Project Structure

```
my-store/
├── apps/
│   ├── web/         # Frontend (React + Vite)
│   └── server/      # Backend (Express + tRPC)
├── packages/
│   ├── api/         # API layer
│   ├── db/          # Database schema & client
│   ├── config/      # Shared configurations
│   └── env/         # Environment validation
├── docs/            # Documentation
└── .github/         # GitHub Actions workflows
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 🚢 Deployment

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md#deployment-architecture) for deployment instructions.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## 📝 License

This project is private and proprietary.

## 🙏 Acknowledgments

Built with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack)

## 📞 Support

For questions or issues, please open an issue on GitHub.
