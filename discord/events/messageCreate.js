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

    const NO_TYPE_CHANNEL_IDS = [REGISTRATION_ID, TICKETS_ID, AWARD_VOTING_ID];

    const isInNoTypeChannel = NO_TYPE_CHANNEL_IDS.some(
      (channelID) => channelID === message.channel.id
    );

    if (isInNoTypeChannel) await message.delete();

    if (message.channel.id === SUGGESTIONS_ID) {
      message.react(OkHand);
      message.react(X);
    }
  },
};
