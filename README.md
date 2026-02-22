<div align="center">

# 🎵 Astranyx Music Bot

<img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white" />
<img src="https://img.shields.io/badge/yt--dlp-latest-FF0000?style=for-the-badge&logo=youtube&logoColor=white" />
<img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
<img src="https://img.shields.io/badge/version-5.0.0-blue?style=for-the-badge" />

**A powerful, self-hosted Discord music bot with slash commands, text prefix support,
and per-server customization - powered by yt-dlp for reliable YouTube streaming.**

[Features](#-features) · [Requirements](#-requirements) · [Installation](#-installation) · [Configuration](#-configuration) · [Commands](#-commands) · [Contributing](#-contributing)

</div>

---

## ✨ Features

- 🎶 **YouTube streaming** via yt-dlp - reliable, always up to date
- 🔍 **Search by name or URL** - paste a YouTube link or just type a song name
- 📋 **Playlist support** - queue entire YouTube playlists instantly
- 🔁 **Loop modes** - loop a single track or the entire queue
- 🔀 **Shuffle** - randomize your queue at any time
- 🔊 **Volume control** - per-server volume adjustment (0–100)
- ⏭️ **Skip to position** - jump directly to any track in the queue
- 💬 **Dual command system** - both slash commands (`/play`) and text prefix (`!play`)
- 🏷️ **Custom prefix** - each server can set their own prefix
- 🔒 **Admin-only prefix change** - requires Manage Server permission
- 📌 **Now Playing embeds** - rich embeds with title, author, thumbnail and controls
- 🎛️ **Button controls** - pause, skip, stop, shuffle via interactive buttons
- 🕐 **24/7 mode** - keep the bot in voice channel even when queue ends

---

## 📋 Requirements

| Requirement | Version |
|---|---|
| [Node.js](https://nodejs.org/) | 18.0.0 or higher |
| [Python](https://python.org/) | 3.7 or higher |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Latest |
| A Discord Bot Token | - |

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/nishantnirwan/discord-music-bot.git
cd discord-music-bot
```

### 2. Install Node dependencies

```bash
npm install
```

### 3. Install yt-dlp

```bash
pip install yt-dlp
```

> **Windows users:** If `pip` isn't recognized, try `python -m pip install yt-dlp`

### 4. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values (see [Configuration](#-configuration) below).

### 5. Register slash commands with Discord

```bash
node src/deploy-commands.js
```

> You only need to run this once, or again if you add/rename commands.

### 6. Start the bot

```bash
npm start
```

You should see:
```
[Commands] Loaded 17 slash commands.
[Events] Loaded 2 events.
[PrefixHandler] Text prefix commands registered.
[YouTubeClient] yt-dlp ready.
[Bot] Logged in as YourBot#1234
```

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and fill in the following:

```env
# ── Required ──────────────────────────────────────────────────────────────
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_application_client_id_here

# ── Optional ──────────────────────────────────────────────────────────────

# Guild ID for instant slash command updates during development.
# Remove this (or leave blank) for global commands in production.
GUILD_ID=your_test_server_id_here

# Default text prefix for all servers (can be overridden per server)
DEFAULT_PREFIX=!

# Default volume for all servers (0–100)
DEFAULT_VOLUME=50

# Keep bot in voice channel after queue ends (true/false)
ALWAYS_ON=false
```

### Getting your credentials

| Value | Where to find it |
|---|---|
| `DISCORD_TOKEN` | [Discord Developer Portal](https://discord.com/developers/applications) → Your App → Bot → Token |
| `CLIENT_ID` | Developer Portal → Your App → General Information → Application ID |
| `GUILD_ID` | Right-click your server in Discord → Copy Server ID *(requires Developer Mode)* |

> **Enable Developer Mode:** Discord Settings → Advanced → Developer Mode ✅

---

## 📖 Commands

All commands work as both **slash commands** (`/play`) and **text prefix commands** (`!play`).

### 🎵 Music

| Command | Description |
|---|---|
| `/play <song>` | Play a song by name or YouTube URL |
| `/skip [position]` | Skip current track, or skip to a position |
| `/stop` | Stop playback and clear the queue |
| `/pause` | Pause the current track |
| `/resume` | Resume a paused track |
| `/leave` | Disconnect from voice channel |
| `/queue [page]` | View the current queue |
| `/nowplaying` | Show the currently playing track |
| `/volume [0-100]` | Get or set the volume |
| `/shuffle` | Shuffle the queue |
| `/loop <off\|track\|queue>` | Set loop mode |
| `/move <from> <to>` | Move a track in the queue |
| `/remove <position>` | Remove a track from the queue |
| `/search <query>` | Search YouTube and pick a result |
| `/autoplay` | Toggle autoplay mode |
| `/247` | Toggle 24/7 mode (stay in VC) |

### ⚙️ Settings *(Admin only - requires Manage Server)*

| Command | Description |
|---|---|
| `/prefix set <prefix>` | Set a custom prefix for this server |
| `/prefix view` | View the current prefix |
| `/prefix reset` | Reset prefix to the default |

### 💡 Shortcuts (text prefix only)

| Shortcut | Full command |
|---|---|
| `!p` | `!play` |
| `!s` | `!skip` |
| `!q` | `!queue` |
| `!np` | `!nowplaying` |
| `!vol` | `!volume` |
| `!help` | Shows all available text commands |

---

## 🗂️ Project Structure

```
discord-music-bot/
├── src/
│   ├── commands/        # All slash command files
│   ├── events/          # Discord event handlers
│   ├── handlers/
│   │   ├── commandHandler.js   # Loads slash commands
│   │   ├── eventHandler.js     # Loads events
│   │   └── prefixHandler.js    # Text prefix command router
│   ├── utils/
│   │   ├── GuildQueue.js       # Audio queue & playback engine
│   │   ├── YouTubeClient.js    # yt-dlp streaming interface
│   │   ├── prefixManager.js    # Per-server prefix storage
│   │   ├── helpers.js          # Embed builders & utilities
│   │   └── sodiumShim.js       # Voice encryption shim
│   ├── deploy-commands.js      # Slash command registration script
│   └── index.js                # Entry point
├── data/
│   └── prefixes.json    # Per-server prefix overrides (auto-generated)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔄 Keeping yt-dlp Updated

YouTube frequently changes its internals. If songs stop playing, update yt-dlp:

```bash
pip install -U yt-dlp
```

It's good practice to run this weekly or whenever you notice streaming issues.

---

## 🖥️ Running 24/7 (Production)

To keep the bot running after you close your terminal, use [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start src/index.js --name music-bot
pm2 save
pm2 startup
```

Useful PM2 commands:

```bash
pm2 logs music-bot      # View live logs
pm2 restart music-bot   # Restart the bot
pm2 stop music-bot      # Stop the bot
```

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 👤 Author

**Nishant Yadav**

- GitHub: [@nishantnirwan](https://github.com/nishantnirwan)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/nishantnirwan">Nishant Yadav</a></sub>
</div>
