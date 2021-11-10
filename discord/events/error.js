const { BOT_ERROR_ID } = require("../config/channels");

module.exports = {
  name: "error",
  async execute(error) {
    interaction.client.channels.cache.get(BOT_ERROR_ID).send({
      content: error.message,
    });

    // client.login(TOKEN);
  },
};
