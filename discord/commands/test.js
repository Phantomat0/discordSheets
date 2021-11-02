const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageAttachment } = require("discord.js");
const updateTeamRosters = require("../updaterosters");

module.exports = {
  allowedRoles: ["Admin"],
  allowedChannels: [],
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Test Database"),
  async execute(interaction) {
    //   const thread = await interaction.channel.threads.create({
    //     name: "food-talk",
    //     autoArchiveDuration: 2400,
    //     reason: "Needed a separate thread for food",
    //   });

    //   if (thread.joinable) await thread.join()

    updateTeamRosters(interaction.client);

    interaction.editReply({
      content: "YUP",
    });
  },
};
