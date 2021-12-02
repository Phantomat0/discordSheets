const { MOD_LOG_ID } = require("../config/channels");

module.exports = {
  name: "guildBanAdd",
  async execute(guild, user) {
    console.log(user);
    console.log(guild);
    console.log("WORKS!!!!");
    // Send message to Mod Log Channel
    // await guild.channels.cache.get(MOD_LOG_ID).send({
    //   content: `BANNED LMAO PCE`,
    //   //   embeds: [unmutedEmbed],
    // });

    // client.login(TOKEN);
  },
};
