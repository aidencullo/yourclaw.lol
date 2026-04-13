# yourclaw.lol

Get a personal AI assistant in one click, powered by [OpenClaw](https://github.com/openclaw/openclaw).

## What is this?

[OpenClaw](https://docs.openclaw.ai) is an open-source personal AI assistant that connects to the channels you already use — WhatsApp, Telegram, Slack, Discord, and more. It's powerful, but setting it up takes effort.

**yourclaw.lol** removes the friction. Click a button, get a fully configured OpenClaw instance. No terminal, no Docker, no config files.

## How it works

1. Visit [yourclaw.lol](http://yourclaw.lol)
2. Click "Get an assistant"
3. Get your own OpenClaw instance, ready to go

## Stack

- Landing page on [GitHub Pages](https://pages.github.com/)
- Domain: `yourclaw.lol` (Hostinger DNS → GitHub Pages)
- CI: [Claude Code Action](https://github.com/anthropics/claude-code-action) + [Greptile](https://greptile.com) for PR reviews
- Provisioning: Hostinger VPS API (coming soon)

## Contributing

PRs welcome. Greptile and Claude will automatically review them.

## License

MIT
