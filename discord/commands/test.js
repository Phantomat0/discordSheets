const { SlashCommandBuilder } = require("@discordjs/builders");
const Sheet = require("../../sheets/sheet");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Test Database")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Info about a user")
        .addUserOption((option) =>
          option.setName("target").setDescription("The user")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("server").setDescription("Info about the server")
    ),
  async execute(interaction) {
    console.log(interaction);
    Sheet.list();
    interaction.reply("LOL IT WORKED");
  },
};
