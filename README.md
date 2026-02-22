<div align="center">

<br/>

# Astranyx Music Bot

<p>
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Discord.js-v14-5865F2?style=flat-square&logo=discord&logoColor=white" />
  <img src="https://img.shields.io/badge/yt--dlp-latest-FF0000?style=flat-square&logo=youtube&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-f0c000?style=flat-square" />
  <img src="https://img.shields.io/badge/version-5.0.0-0ea5e9?style=flat-square" />
</p>

<p>A powerful, self-hosted Discord music bot with slash commands, text prefix support,<br/>and per-server customization :- powered by yt-dlp for reliable YouTube streaming.</p>

[Features](#features) &nbsp;·&nbsp; [Requirements](#requirements) &nbsp;·&nbsp; [Installation](#installation) &nbsp;·&nbsp; [Configuration](#configuration) &nbsp;·&nbsp; [Commands](#commands) &nbsp;·&nbsp; [Contributing](#contributing)

<br/>

</div>

---

## Features

<table>
<tr>
<td width="50%">

**<img src="https://cdn.simpleicons.org/youtube/FF0000" width="13" valign="middle"/> &nbsp;YouTube Streaming**  
Reliable audio via yt-dlp, always up to date.

**<img src="https://cdn.simpleicons.org/discord/5865F2" width="13" valign="middle"/> &nbsp;Dual Command System**  
Slash commands (`/play`) and text prefix (`!play`).

**<img src="https://cdn.simpleicons.org/git/F05032" width="13" valign="middle"/> &nbsp;Playlist Support**  
Queue entire YouTube playlists instantly.

**<img src="https://cdn.simpleicons.org/apachesolr/D9411E" width="13" valign="middle"/> &nbsp;Search by Name or URL**  
Paste a YouTube link or just type a song name.

**<img src="https://cdn.simpleicons.org/soundcloud/FF3300" width="13" valign="middle"/> &nbsp;Volume Control**  
Per-server volume adjustment from 0 to 100.

</td>
<td width="50%">

**<img src="https://cdn.simpleicons.org/buffer/000000" width="13" valign="middle"/> &nbsp;Loop Modes**  
Loop a single track or the entire queue.

**<img src="https://cdn.simpleicons.org/algorand/000000" width="13" valign="middle"/> &nbsp;Shuffle**  
Randomize your queue at any time.

**<img src="https://cdn.simpleicons.org/hackthebox/9FEF00" width="13" valign="middle"/> &nbsp;Custom Prefix**  
Each server sets its own command prefix.

**<img src="https://cdn.simpleicons.org/letsencrypt/003A70" width="13" valign="middle"/> &nbsp;Admin Controls**  
Prefix changes require Manage Server permission.

**<img src="https://cdn.simpleicons.org/clockify/F24E1E" width="13" valign="middle"/> &nbsp;24/7 Mode**  
Keep the bot in voice channel when the queue ends.

</td>
</tr>
</table>

---

## Requirements

| Requirement | Version |
|---|---|
| <img src="https://cdn.simpleicons.org/nodedotjs/339933" width="14" valign="middle"/> &nbsp;[Node.js](https://nodejs.org/) | `18.0.0` or higher |
| <img src="https://cdn.simpleicons.org/python/3776AB" width="14" valign="middle"/> &nbsp;[Python](https://python.org/) | `3.7` or higher |
| <img src="https://cdn.simpleicons.org/youtube/FF0000" width="14" valign="middle"/> &nbsp;[yt-dlp](https://github.com/yt-dlp/yt-dlp) | Latest |
| <img src="https://cdn.simpleicons.org/discord/5865F2" width="14" valign="middle"/> &nbsp;Discord Bot Token | - |

---

## Installation

### 1 &nbsp;·&nbsp; Clone the repository

```bash
git clone https://github.com/nishantnirwan/discord-music-bot.git
cd discord-music-bot
```

### 2 &nbsp;·&nbsp; Install Node dependencies

```bash
npm install
```

### 3 &nbsp;·&nbsp; Install yt-dlp

```bash
pip install yt-dlp
```

> **Windows users:** If `pip` isn't recognised, try `python -m pip install yt-dlp`

### 4 &nbsp;·&nbsp; Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values :- see [Configuration](#configuration) below.

### 5 &nbsp;·&nbsp; Register slash commands with Discord

```bash
node src/deploy-commands.js
```

> Only required once, or when commands are added or renamed.

### 6 &nbsp;·&nbsp; Start the bot

```bash
npm start
```

Expected output:

```
[Commands]      Loaded 17 slash commands.
[Events]        Loaded 2 events.
[PrefixHandler] Text prefix commands registered.
[YouTubeClient] yt-dlp ready.
[Bot]           Logged in as YourBot#1234
```

---

## Configuration

Copy `.env.example` to `.env` and populate the following fields:

```env
# ── Required ──────────────────────────────────────────────────────────────
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_application_client_id_here

# ── Optional ──────────────────────────────────────────────────────────────

# Guild ID for instant slash command updates during development.
# Remove or leave blank for global commands in production.
GUILD_ID=your_test_server_id_here

# Default text prefix for all servers (can be overridden per server)
DEFAULT_PREFIX=!

# Default volume for all servers (0–100)
DEFAULT_VOLUME=50

# Keep bot in voice channel after queue ends (true/false)
ALWAYS_ON=false
```

### Obtaining your credentials

| Variable | Where to find it |
|---|---|
| `DISCORD_TOKEN` | [Developer Portal](https://discord.com/developers/applications) → Your App → **Bot** → Token |
| `CLIENT_ID` | Developer Portal → Your App → **General Information** → Application ID |
| `GUILD_ID` | Right-click your server in Discord → **Copy Server ID** *(requires Developer Mode)* |

> **Enable Developer Mode:** Discord Settings → Advanced → Developer Mode

---

## Commands

All commands work as both slash commands (`/play`) and text prefix commands (`!play`).

### Music

| Command | Description |
|---|---|
| `/play <song>` | Play a song by name or YouTube URL |
| `/skip [position]` | Skip the current track, or jump to a position |
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

### Settings &nbsp;<sup>Admin · Requires Manage Server</sup>

| Command | Description |
|---|---|
| `/prefix set <prefix>` | Set a custom prefix for this server |
| `/prefix view` | View the current prefix |
| `/prefix reset` | Reset prefix to the default |

### Shortcuts &nbsp;<sup>Text prefix only</sup>

| Shortcut | Equivalent |
|---|---|
| `!p` | `!play` |
| `!s` | `!skip` |
| `!q` | `!queue` |
| `!np` | `!nowplaying` |
| `!vol` | `!volume` |
| `!help` | Shows all available text commands |

---

## Project Structure

```
discord-music-bot/
├── src/
│   ├── commands/              # Slash command files
│   ├── events/                # Discord event handlers
│   ├── handlers/
│   │   ├── commandHandler.js  # Loads slash commands
│   │   ├── eventHandler.js    # Loads events
│   │   └── prefixHandler.js   # Text prefix command router
│   ├── utils/
│   │   ├── GuildQueue.js      # Audio queue & playback engine
│   │   ├── YouTubeClient.js   # yt-dlp streaming interface
│   │   ├── prefixManager.js   # Per-server prefix storage
│   │   ├── helpers.js         # Embed builders & utilities
│   │   └── sodiumShim.js      # Voice encryption shim
│   ├── deploy-commands.js     # Slash command registration script
│   └── index.js               # Entry point
├── data/
│   └── prefixes.json          # Per-server prefix overrides (auto-generated)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Keeping yt-dlp Updated

YouTube frequently changes its internals. If songs stop playing, update yt-dlp:

```bash
pip install -U yt-dlp
```

Running this weekly, or whenever streaming issues occur, is recommended.

---

## Running 24/7 (Production)

To keep the bot alive after closing your terminal, use [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start src/index.js --name music-bot
pm2 save
pm2 startup
```

**Useful PM2 commands:**

```bash
pm2 logs music-bot      # Stream live logs
pm2 restart music-bot   # Restart the bot
pm2 stop music-bot      # Stop the bot
```

---

## Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## Author

**Nishant Yadav** &nbsp;·&nbsp; <img src="https://cdn.simpleicons.org/github/181717" width="14" valign="middle"/> &nbsp;[@nishantnirwan](https://github.com/nishantnirwan)

---

## License

Released under the **MIT License** :- see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built by <a href="https://github.com/nishantnirwan">Nishant Yadav</a></sub>
</div>
