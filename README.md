# Otaku Archive

An anime rating and portfolio platform built around AniList’s public GraphQL API.

## Stack

React + Vite + TypeScript power the web app. Express + TypeScript expose the server API. PostgreSQL and Prisma store users, normalized anime, portfolios, and reviews. JWT tokens authenticate users and bcrypt hashes passwords.

## AniList integration and caching

The browser calls our Express API only. The API calls `https://graphql.anilist.co`, normalizes detail results into the local `Anime` table, and uses the local ID for all portfolio and review relations.

Search payloads are cached for 15 minutes. Normalized anime metadata and detail lookups are cached for 24 hours. Expired entries refresh on the next request. This reduces repeated upstream traffic while allowing metadata to refresh daily.

Search is resilient when PostgreSQL is unavailable: it falls back to a direct AniList request, then to Jikan’s free no-auth API. AniList remains the primary provider. No API key is required for either provider.

On anime detail pages, AniList’s global score is shown separately from “Our rating”, which is calculated from reviews stored by this site.

## Profiles

After login, users are redirected to `/profile/:username`. The header shows the signed-in username and avatar instead of “Sign in”. Public profiles expose bio, portfolio entries, and reviews. Only the authenticated owner can call `PATCH /api/users/me` to edit their bio or upload an avatar as multipart field `avatar`; accepted image types are JPG, PNG, WEBP, and GIF up to 5MB.

## Background licensing decision

The ambient background is a CSS/Canvas particle and gradient animation. It uses no anime footage, scraped clips, or redistributed copyrighted media. This avoids silently creating a licensing problem while keeping the browsing experience atmospheric. If user uploads are added later, the upload flow must require users to confirm they own the rights or have permission to use the clip/GIF.

To use a motion video, set `VITE_BACKGROUND_VIDEO_URL` to a short clip that you own or are licensed to use. Direct `.mp4`/`.webm` URLs play in a native video element. YouTube watch, `youtu.be`, Shorts, and embed URLs are converted to a muted looping `youtube-nocookie.com` background embed. Restart Vite after changing any `VITE_` variable. The app does not fetch or embed copyrighted anime edits by default.

## Run locally

1. Copy `.env.example` to `.env` in the repository root. The API loads this file even when started from `apps/api`.
2. Start the project PostgreSQL with `docker compose up db -d` (host port 55432, avoiding collisions with existing local PostgreSQL services).
3. Run `npm install`, `npx prisma generate`, and `npx prisma migrate dev --name init`.
4. Run `npm run dev`.

The web app runs on port 5173 and the API on port 4000.

If login or signup reports a database error, check `http://localhost:4000/api/health`. Start the database with `docker compose up -d db`; the project database is exposed on host port `55432`.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/anime/search?q=` | Search AniList/Jikan through the server proxy |
| `GET` | `/api/anime/:id` | Anime metadata, community rating, and reviews |
| `GET` | `/api/anime/seasonal?season=&year=` | Cached seasonal AniList results (24 hours) |
| `POST` | `/api/anime/:id/review` | Create a review, including `containsSpoilers` |
| `PATCH/DELETE` | `/api/reviews/:id` | Edit or delete an owned review |
| `POST/DELETE` | `/api/reviews/:id/like` | Like or idempotently unlike a review; likes do not create feed activity |
| `POST` | `/api/lists` | Create a custom anime list |
| `GET` | `/api/lists/mine` | Authenticated user's lists |
| `GET` | `/api/lists/:id` | View a public list or an owned private list |
| `PATCH/DELETE` | `/api/lists/:id` | Edit or delete an owned list |
| `POST/DELETE` | `/api/lists/:id/items` / `/api/lists/:id/items/:animeId` | Add/remove list items; removal uses the local Anime ID |
| `GET` | `/api/users/:username/lists` | Public lists for a profile |
| `GET` | `/api/users/:username` | Public profile, follow counts, and requester follow state |
| `POST/DELETE` | `/api/users/:username/follow` | Follow or unfollow a user |
| `GET` | `/api/users/:username/followers` | Paginated followers |
| `GET` | `/api/users/:username/following` | Paginated following list |
| `GET` | `/api/users/:username/stats` | Portfolio and genre statistics |
| `GET` | `/api/users/:username/activity` | Public activity log |
| `GET` | `/api/feed` | Authenticated feed from followed users |

## Tests

`npm test` covers password/JWT primitives, cache TTL policy, ownership, follow validation, feed filtering/pagination, stats accuracy, spoiler round-tripping, review likes, custom-list ownership/items, and seasonal boundary calculation. The integration tests use the configured PostgreSQL database.
