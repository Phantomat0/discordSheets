const { SUGGESTIONS_ID, REGISTRATION_ID } = require("../config/channels");
const { OkHand, X } = require("../icons");

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot) return;
    if (message.channel.id === REGISTRATION_ID) {
      await message.delete();
    }

    if (message.channel.id === SUGGESTIONS_ID) {
      message.react(OkHand);
      message.react(X);
    }
  },
};
