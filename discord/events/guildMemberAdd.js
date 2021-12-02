const { GENERAL_ID } = require("../config/channels");

module.exports = {
  name: "guildMemberAdd",
  async execute(member, client) {
    member.guild.channels.cache.get(GENERAL_ID).send({
      content: `Welcome to American Futsal <@${member.user.id}>!`,
    });
  },
};
