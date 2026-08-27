# Samvid

Samvid is a full-stack civic issue reporting platform that connects citizens with city response teams. Citizens can submit location-based reports with photo evidence, follow a public case timeline, and receive notifications as work progresses. Administrators can triage cases, set priority, assign departments, publish status updates, view geographic issue patterns, and send civic notices.

## Product capabilities

- Secure citizen registration and credential-based authentication
- Public, searchable civic report register
- Location selection with OpenStreetMap and optional reverse geocoding
- Photo evidence with validated local development uploads and Cloudinary production storage
- Citizen dashboard, report editing rules, and case history
- Notification inbox for case changes and public notices
- Protected administrator dashboard and case queue
- Status, priority, department assignment, and batch updates
- Department directory and geographic operations map
- MongoDB geospatial queries and privacy-safe public API responses

## Technology

- Next.js 15 App Router and React 19
- Tailwind CSS 4
- NextAuth credentials authentication
- MongoDB and Mongoose
- Leaflet and OpenStreetMap
- Cloudinary-compatible production image uploads

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

3. Configure `MONGODB_URI` and `NEXTAUTH_SECRET` in `.env.local`.

4. Start the application:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000`.

## Create the first administrator

Register a normal citizen account, then promote it from the project directory:

```bash
npm run admin:promote -- citizen@example.com
```

Public registration never accepts an administrator code or role.

## Production configuration

Set `NEXTAUTH_URL` to the deployed origin and configure all three Cloudinary values for persistent photo uploads. `OPENCAGE_API_KEY` is optional; without it, the selected coordinates remain available and the address can be entered manually.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

Use `npm run check` to run all three gates in sequence.
