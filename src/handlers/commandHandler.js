const { readdirSync } = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const files = readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

  let loaded = 0;
  for (const file of files) {
    const command = require(path.join(commandsPath, file));
    if (command?.data && command?.execute) {
      client.commands.set(command.data.name, command);
      loaded++;
    }
  }
  console.log(`[Commands] Loaded ${loaded} slash commands.`);
}

module.exports = { loadCommands };
