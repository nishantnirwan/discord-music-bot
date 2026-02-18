// Load libsodium-wrappers so @discordjs/voice can use it for encryption
// Must be required before @discordjs/voice is used
const sodium = require('libsodium-wrappers');
module.exports = sodium.ready;
