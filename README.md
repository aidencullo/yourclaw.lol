# yourclaw.lol

One-click OpenClaw instances. You click, we provision.

## What is this?

[OpenClaw](https://github.com/openclaw/openclaw) is a personal AI assistant you run on your own devices. It's powerful but complex to set up.

**yourclaw.lol** removes the friction — sign in, click a button, get a fully configured OpenClaw instance running on its own VPS. No terminal, no Docker, no config files.

## Stack

- **Landing page**: Static `index.html` at the repo root, served by GitHub Pages
- **Web app** (in progress): Next.js 16 + React 19, Tailwind CSS, NextAuth (Google OAuth)
- **Provisioning**: Fly.io Machines API — spins up a per-user Docker container in ~5 seconds
- **Domain**: `yourclaw.lol` (Hostinger DNS → GitHub Pages)

## How it's hosted

There are currently **two surfaces**, and only one of them is published:

| Surface | Source | Where it's hosted | Status |
|---|---|---|---|
| Public landing page (`yourclaw.lol`) | `index.html` at repo root | GitHub Pages, custom domain via `CNAME` | **Live** |
| Next.js app (`/dashboard`, `/api/provision`) | `app/` directory | Not deployed yet | Local dev only |

The Next.js app needs a host that can run a Node.js server (GitHub Pages is static-only). The plan is to deploy it to **Vercel** and either route a subdomain (e.g. `app.yourclaw.lol`) to it, or migrate the apex domain to Vercel and serve the landing page from the Next.js app instead.

## Pipeline

There is **no CI/CD pipeline configured yet** — no `.github/workflows/`, no automated tests, no automated deploys.

- The landing page deploys automatically because GitHub Pages watches the `main` branch and republishes `index.html` on every push.
- The Next.js app has no build, lint, or deploy automation. To be added:
  - GitHub Actions workflow for `npm run build` + `tsc` on PRs
  - Vercel deploy on merge to `main` (Vercel can also do per-PR preview deploys out of the box)

## Development

### Static landing page

```bash
# just open it in a browser
open index.html
```

### Next.js app

```bash
# install
npm install

# copy env template and fill in values
cp .env.example .env.local

# run dev server
npm run dev
```

Open http://localhost:3000.

#### Required environment variables

| Var | What it's for |
|---|---|
| `AUTH_SECRET` | NextAuth session encryption (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `ANTHROPIC_API_KEY` | Claude API (used inside provisioned instances, eventually) |
| `FLY_API_TOKEN` | Fly.io API token (`fly tokens create deploy -a <app>`) |
| `FLY_APP_NAME` | The Fly.io app that user machines belong to |
| `FLY_MACHINE_IMAGE` | Docker image to boot for each user (e.g. an OpenClaw image) |
| `FLY_DEFAULT_REGION` | Fly.io region code (default `iad`) |

## License

MIT
