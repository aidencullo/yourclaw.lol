# yourclaw.lol

One-click OpenClaw instances. Click the button, we provision a dedicated Fly.io
machine running OpenClaw for you. No sign-in required.

## What is this?

[OpenClaw](https://github.com/openclaw/openclaw) is a personal AI assistant you
run on your own infrastructure. It's powerful but fiddly to set up.

**yourclaw.lol** removes the friction — click a button, and a Fly.io app
+ machine running OpenClaw is provisioned for you. No terminal, no
Docker, no config files, no sign-in.

## Stack

- **Next.js 16** app (App Router, TypeScript)
- **Fly.io Machines API** for per-user app + machine provisioning
- Cookie-based identity (`claw-id` UUID v4) for deterministic app naming
  (`openclaw-<sha256(uuid)[:12]>`) so provisioning is idempotent without a
  database

## Flow

1. User clicks **Get an assistant** and is taken to `/dashboard`
2. A `claw-id` cookie (UUID v4) is generated on first visit
3. `/dashboard` calls `POST /api/provision`
4. The API derives a Fly app name from the cookie UUID, calls
   `api.machines.dev` to ensure the app + a single machine exist, and returns
   the public hostname
5. Dashboard polls `GET /api/status` until the machine is `started`, then
   renders a link to `https://openclaw-<hash>.fly.dev`

## Development

```bash
cp .env.example .env.local
# fill in FLY_* values

npm install
npm run dev
```

Open <http://localhost:3000>.

## Env vars

See `.env.example`. The important ones:

| Variable              | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `FLY_API_TOKEN`       | Fly deploy token (org-scoped)                     |
| `FLY_ORG_SLUG`        | Fly org under which user apps are created        |
| `OPENCLAW_IMAGE`      | Docker image to run on each provisioned machine   |

## Deployment

The API routes require a Node runtime. Deploy to Vercel, or to Fly.io itself.
DNS for `yourclaw.lol` needs to point to the deployment host.

## License

MIT
