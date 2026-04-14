# yourclaw.lol

One-click OpenClaw instances. You sign in, we provision a dedicated Fly.io
machine running OpenClaw for you.

## What is this?

[OpenClaw](https://github.com/openclaw/openclaw) is a personal AI assistant you
run on your own infrastructure. It's powerful but fiddly to set up.

**yourclaw.lol** removes the friction — sign in with Google, and a Fly.io app
+ machine running OpenClaw is provisioned under your account. No terminal, no
Docker, no config files.

## Stack

- **Next.js 16** app (App Router, TypeScript)
- **NextAuth v5** with Google OAuth
- **Fly.io Machines API** for per-user app + machine provisioning
- Deterministic app naming (`openclaw-<sha256(email)[:12]>`) so provisioning
  is idempotent without a database

## Flow

1. User clicks **Get an assistant** → Google OAuth
2. On return, `/dashboard` calls `POST /api/provision`
3. The API derives a Fly app name from the user's email, calls
   `api.machines.dev` to ensure the app + a single machine exist, and returns
   the public hostname
4. Dashboard polls `GET /api/status` until the machine is `started`, then
   renders a link to `https://openclaw-<hash>.fly.dev`

## Development

```bash
cp .env.example .env.local
# fill in AUTH_* and FLY_* values

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
| `AUTH_GOOGLE_ID/SECRET` | Google OAuth client                             |

## Deployment

This is no longer a static GitHub Pages site — the API routes require a
Node runtime. Deploy to Vercel, or to Fly.io itself. DNS for `yourclaw.lol`
needs to be repointed from GitHub Pages to the new host.

## License

MIT
