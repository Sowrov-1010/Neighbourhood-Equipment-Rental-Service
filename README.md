# Neighborhood Equipment Rental Service

A neighborhood equipment-sharing web app for discovering tools, listing equipment, coordinating rentals, and managing community requests. The repository contains a React frontend and a partial Laravel API/backend implementation.

> **Project status:** This repository is a prototype/demo, not a production-ready rental or payments platform. The frontend includes demo authentication and sample data. Review the security notes below before connecting it to real users or data.

## Features

- Browse the neighborhood equipment directory and view listing details.
- Create equipment listings and rental requests.
- Track rental requests and their handover, return, dispute, and review flows.
- Publish and browse community equipment broadcasts.
- Explore equipment in the neighborhood map view.
- View resident profiles, notifications, and a resident-support chat interface.
- Access a separate administrative console.
- Persist browser state locally and optionally synchronize app collections to Firebase Firestore in real time.

## Technology

- React 19, TypeScript, and Vite
- Tailwind CSS 4 and Motion
- Firebase Authentication (anonymous sign-in) and Cloud Firestore
- Laravel 11 API source, Sanctum, Reverb, and MySQL/PostgreSQL spatial schema files

## Requirements

- Node.js and npm
- A modern browser

The frontend can be run without starting the Laravel backend. Firebase is needed only for cloud synchronization; the app also stores its state in browser `localStorage`.

## Run the frontend

From the repository root:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Vite binds to `0.0.0.0`, so the development server may also be accessible to other devices on your local network. Do not use the development server as a public production deployment.

### Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server on port 3000. |
| `npm run build` | Build the frontend with Vite into `dist/`. |
| `npm run preview` | Preview the built frontend locally. |
| `npm run lint` | Run the TypeScript compiler without emitting files. |
| `npm run clean` | Remove generated `dist/` and `server.js` files (the script uses `rm -rf`, so it requires a Unix-like shell). |

## Firebase configuration

The frontend imports its Firebase client settings from the root-level `firebase-applet-config.json`. To use your own Firebase project:

1. Create a Firebase project and a Cloud Firestore database.
2. Enable Firebase **Anonymous** Authentication if anonymous sign-in is required by your Firestore rules.
3. Configure the client settings and Firestore database ID in `firebase-applet-config.json`.
4. Review and deploy appropriate Firestore security rules for your project.

The app subscribes to collections including `assets`, `users`, `rental_requests`, `disputes`, `broadcasts`, `reviews`, and `notifications`. If Firebase is unavailable, browser-side state is still stored locally; local data is specific to the browser and origin.

Firebase client configuration is included in frontend code and is not a place for server secrets. Do not put private credentials, service-account keys, or privileged API secrets in this file.

## Backend

`backend-laravel/` contains Laravel controllers, models, middleware, scheduled commands, migrations, seed data, API routes, and MySQL/PostgreSQL schema examples. The API source includes authentication, tools, rentals, and administrative routes under `/api`.

**This directory is not a complete, standalone Laravel application as currently checked in.** It does not include Laravel's application bootstrap, `artisan` entry point, or full configuration tree, and the frontend does not currently call these API routes. Treat it as backend implementation source that still needs to be integrated into a complete Laravel 11 application before it can be installed or served.

The schema examples target MySQL 8+ with spatial support or PostgreSQL 15+ with PostGIS. Both schema SQL files contain destructive `DROP TABLE` statements; inspect them and back up any database before running them. The Laravel API also expects suitable database credentials and service configuration, including the settings described in `backend-laravel/.env.example`.

## Repository layout

```text
src/
  components/       React views, forms, and modals
  context/          Shared app state, local persistence, and Firestore sync
  data/             Demo users, listings, requests, and neighborhood data
  assets/images/    Listing images
  App.tsx           Main app shell and view routing
  firebase.ts       Firebase initialization and Firestore helpers
backend-laravel/
  app/              Laravel API controllers, models, middleware, and commands
  database/         Migrations, seeder, and SQL schema examples
  routes/           API and scheduled-task route definitions
firebase-applet-config.json
firestore.rules
```

## Data and security considerations

- Frontend sign-in and role handling are demo-oriented and use browser-side state. They are not a secure authentication or authorization boundary.
- Demo data in `src/data/mockData.ts` includes sample account credentials and payment/contact details. Do not reuse them or enter real personal, payment, or identity data into this prototype.
- The checked-in `firestore.rules` permits broad public reads and writes. It is suitable only for experimentation in an isolated demo project; it must be replaced with restrictive, tested rules before using real data.
- The frontend can seed sample data into Firestore when its collections are empty. Use a dedicated development Firebase project to avoid mixing demo records with real data.
- Rental payments are represented by app flows; this repository does not establish a secure payment processor integration.
- The SQL schema files include destructive statements and are examples, not safe production migrations.

## Development notes

- TypeScript settings are in `tsconfig.json`; Vite configuration is in `vite.config.ts`.
- Static assets and production output are generated by the frontend build; generated `dist/` and installed `node_modules/` are ignored by Git.
- No frontend test script is currently defined in `package.json`.
