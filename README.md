# yourclaw.lol

One-click OpenClaw instances. You click, we provision.

## What is this?

[OpenClaw](https://github.com/openclaw/openclaw) is a personal AI assistant you run on your own devices. It's powerful but complex to set up.

**yourclaw.lol** removes the friction — click a button, get a fully configured OpenClaw instance running on its own VPS. No terminal, no Docker, no config files.

## Stack

- Next.js control plane deployed on Fly.io
- Domain: `yourclaw.lol`
- Provisioning backend: Fly Machines API
- Spawned runtime: `ghcr.io/openclaw/openclaw:latest`

## Development

```bash
# serve locally
open index.html
```

## License

MIT
