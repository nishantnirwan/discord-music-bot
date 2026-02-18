const { readdirSync } = require('fs');
const path = require('path');

function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const files = readdirSync(eventsPath).filter((f) => f.endsWith('.js'));

  let loaded = 0;
  for (const file of files) {
    const event = require(path.join(eventsPath, file));
    if (event?.name && event?.execute) {
      if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args));
      } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
      }
      loaded++;
    }
  }
  console.log(`[Events] Loaded ${loaded} events.`);
}

module.exports = { loadEvents };
