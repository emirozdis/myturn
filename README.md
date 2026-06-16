# MyTurn (vlog)

MyTurn is a private, mobile-first Progressive Web App (PWA) designed for close-knit friend groups. Each day, a random member is chosen to vlog their day, keeping the group connected through authentic, daily video moments.

## Core Features

- **Group-Centric Vlogging**: Create or join small, private groups with friends using unique invite codes.
- **Daily Random Vlogger**: A random member is selected each day to be the group's vlogger, taking the pressure off constant content creation.
- **In-App Recording**: A full-featured camera interface for recording, pausing, and previewing video clips directly in the browser.
- **Chronological Feed**: Watch the vlogger's day unfold through a timeline of short video clips.
- **Rich Interactions**: React to vlogs with emojis, leave comments, and share live photo responses.
- **Gamification**: Build personal and group streaks, earn XP, level up your rank, and unlock achievements.
- **PWA Experience**: Install the app to your home screen for a native-like experience with push notifications for important events.
- **Secure & Private**: Media is stored securely and served via signed URLs, accessible only to group members.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Credentials, Google, Apple)
- **Backend Services**: Supabase (Storage)
- **Push Notifications**: `web-push` library
- **Scheduled Jobs**: `node-cron`

## Architecture

The application is a modern full-stack Next.js project. It leverages Server Actions for most of its backend logic, providing a seamless integration between frontend and backend code. API Routes are used for specialized tasks like proxying media from Supabase Storage.

The database schema is defined and managed with Prisma, connecting to a PostgreSQL database. User authentication is robustly handled by NextAuth.js.

The frontend is built with a mobile-first approach, designed to function as a Progressive Web App (PWA). It enforces installation on mobile devices to provide a reliable, app-like experience with access to native features like push notifications and camera.

## Getting Started

### Prerequisites

- Node.js
- npm, yarn, or pnpm
- PostgreSQL database
- Supabase project for storage

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/emirozdis/vlog.git
    cd vlog
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file by copying `.env.example`. Fill in the required credentials for your database, NextAuth, Supabase, and VAPID keys for push notifications.

4.  **Set up the database:**
    ```bash
    npx prisma migrate dev
    npx prisma db seed
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

This project is not licensed for redistribution or commercial use.