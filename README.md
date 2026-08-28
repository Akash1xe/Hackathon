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
- Hosted CLIP evidence analysis with explicit human-review fallbacks
- Duplicate discovery, “affects me too,” and proximity-limited community verification
- Dynamic civic risk, smart department routing, priority-based SLAs, and escalation visibility
- Before/after repair proof, citizen resolution confirmation, disputes, and appeals
- Public-asset registry with QR reporting links and complaint history
- Multilingual voice dictation, predictive hotspot cards, civic reputation, and proof-chain trust scores

## Technology

- Next.js 15 App Router and React 19
- Tailwind CSS 4
- NextAuth credentials authentication
- MongoDB and Mongoose
- Leaflet and OpenStreetMap
- Cloudinary-compatible production image uploads
- Hugging Face hosted inference with a lightweight serverless client

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

3. Configure `NEXTAUTH_SECRET` in `.env`. `npm run dev` starts a project-local
   MongoDB automatically. To use MongoDB Atlas instead, configure a current
   `MONGODB_URI` and start only Next.js with `npm run dev:app`.

4. Start the application:

   ```bash
   npm run dev
   ```

5. Seed the starter departments and QR-addressable public assets (safe to run more than once):

   ```bash
   npm run seed:civic
   ```

Open `http://localhost:3000`.

When `HF_TOKEN` is configured, evidence is analyzed by the hosted CLIP model. If the provider is unavailable, Samvid marks the result for human review instead of rejecting the citizen's report.

## Create the first administrator

Register a normal citizen account, then promote it from the project directory:

```bash
npm run admin:promote -- citizen@example.com
```

The command uses the project-local database by default. Sign out and sign back
in after promotion so the new role is added to the session. Public registration
never accepts an administrator code or role.

## Production configuration

Samvid includes a Vercel build check that fails early when required production credentials are missing. Configure these variables for both Production and Preview in Vercel:

- `MONGODB_URI`: a reachable MongoDB Atlas connection string
- `NEXTAUTH_SECRET`: a random secret with at least 32 characters
- `NEXTAUTH_URL`: the canonical HTTPS deployment URL
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`
- `HF_TOKEN`: recommended for AI evidence analysis
- `HF_VISION_MODEL`: optional; defaults to `openai/clip-vit-large-patch14-336`
- `OPENCAGE_API_KEY`: optional reverse geocoding

Generate an authentication secret locally with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Before deploying, verify the environment and code:

```bash
npm audit --omit=dev
npm run check
npm run validate:production
```

The repository contains `vercel.json`, and Vercel runs `npm run vercel-build`. Production images go directly to Cloudinary; local `/public/uploads` content is deliberately excluded from Git.

After the first deployment, seed the production database using the Vercel CLI:

```bash
vercel env run -e production -- npm run seed:civic
```

Register the first production account in the deployed app, then promote it:

```bash
vercel env run -e production -- npm run admin:promote -- citizen@example.com
```

Sign out and back in after promotion. Keep MongoDB and the Vercel Functions region geographically close to reduce latency.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

Use `npm run check` to run all three gates in sequence.
