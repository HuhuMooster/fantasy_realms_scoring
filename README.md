# Fantasy Realms Scoring

A comprehensive scoring application and session tracker for the board game **Fantasy Realms**. Built with modern web technologies to provide a fast, offline-capable, and user-friendly experience for calculating hand scores and keeping track of game history.

## Features

- **Hand Calculator:** Quickly calculate scores for any hand, including all complex bonuses and penalties.
- **Session Tracking:** Log games with multiple players, keep track of winners, and view historical data.
- **Card Reference:** A full library of cards from the game with their base power, suits, and special abilities.
- **User Authentication:** Secure accounts to save your personal game history.
- **Admin Tools:** Manage users and invitation codes for your group.
- **Responsive Design:** Optimized for both mobile devices (at the table) and desktop.

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/router/v1/docs/guide/start/overview) (React + Nitro + Vinxi)
- **Database:** PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Styling:** Tailwind CSS & [DaisyUI](https://daisyui.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) & [TanStack Query](https://tanstack.com/query/latest)
- **Validation:** [Zod](https://zod.dev/)
- **Testing:** [Vitest](https://vitest.dev/) & React Testing Library

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended)
- PostgreSQL (locally or via Docker)

### Local Development Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd fantasy-realms-scoring
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Environment Variables:**
   Copy the example environment file and fill in your values:

   ```bash
   cp .env.example .env
   ```

   _Make sure to update `DATABASE_URL` and `JWT_SECRET`._

4. **Database Setup:**
   Run migrations and seed the database with game data (cards):

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm start`: Run the production build
- `pnpm check`: Run linting, type-checking, and formatting
- `pnpm test`: Run tests
- `pnpm db:studio`: Open Drizzle Studio to explore your database

## Docker Deployment

The easiest way to run the entire stack (App + Database) is using Docker Compose:

```bash
docker-compose up -d
```

This will:

1. Start a PostgreSQL 18 instance.
2. Automatically run migrations.
3. Seed the database (if needed).
4. Start the application on [http://localhost:3002](http://localhost:3002).

## License

[MIT](LICENSE)
