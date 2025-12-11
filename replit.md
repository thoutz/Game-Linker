# Nexus - Social Gaming App

## Overview
Nexus is a mobile-first social gaming app that helps gamers connect with players they meet in-game. Primary use case is for games like Arc Raiders where in-game friendships exist but external coordination is difficult.

## Recent Changes
- **Dec 2024**: Implemented Replit Auth for user authentication
  - Users sign in with their Replit account
  - Sessions stored in PostgreSQL using connect-pg-simple
  - Auth routes: /api/login, /api/logout, /api/callback, /api/auth/user

## Project Architecture

### Frontend (client/)
- React with Vite
- Wouter for routing
- TanStack Query for data fetching
- Tailwind CSS with shadcn/ui components
- Pages: landing, home, profile, discover, messages, community-detail

### Backend (server/)
- Express.js
- Replit Auth (OpenID Connect)
- Drizzle ORM with PostgreSQL

### Database Schema
- `sessions` - Auth session storage
- `users` - User profiles with gaming info
- `games` - Game catalog
- `user_games` - User's games with ranks
- `communities` - Gaming communities (public/private)
- `community_members` - Community membership
- `posts` - Community posts
- `gaming_sessions` - Scheduled gaming sessions
- `friendships` - User connections
- `messages` - Direct messages

### Key Features
- QR code profile sharing
- Real-time chat
- Game-specific communities (public and private)
- Gaming session scheduling
- LFG (Looking For Group) system

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-provided)
- `SESSION_SECRET` - Session encryption key (required)

## User Preferences
- Mobile-first design approach
- Gaming-focused dark theme with neon accents
