module.exports = {
  name: 'clientReady',   // renamed from 'ready' in discord.js v14 to avoid gateway conflict
  once: true,
  execute(client) {
    console.log(`[Bot] Logged in as ${client.user.tag}`);
    client.user.setActivity('🎵 /play to start', { type: 0 }); // PLAYING
  },
};
