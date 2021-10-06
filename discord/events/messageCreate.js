module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot) return;
    const REGISTRATION_CHANNEL_ID = "892959251788615712";
    const SUGGESTION_CHANNEL_ID = "888561683520430130";
    if (message.channel.id === REGISTRATION_CHANNEL_ID) {
      await message.delete();
    }

    if (message.channel.id === SUGGESTION_CHANNEL_ID) {
      message.react(OkHand);
      message.react(X);
    }
  },
};
