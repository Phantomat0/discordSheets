const {
  SUGGESTIONS_ID,
  REGISTRATION_ID,
  TICKETS_ID,
  AWARD_VOTING_ID,
} = require("../config/channels");
const { OkHand, X } = require("../utils/icons");

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot) return;
    if (
      message.channel.id === REGISTRATION_ID ||
      message.channel.id === TICKETS_ID ||
      message.channel.id === AWARD_VOTING_ID
    ) {
      await message.delete();
    }

    if (message.channel.id === SUGGESTIONS_ID) {
      message.react(OkHand);
      message.react(X);
    }
  },
};
