const { SlashCommandBuilder } = require("@discordjs/builders");
const { FANTASY_MAIN } = require("../config/channels");
const { CommandError } = require("../utils/errors");
const subCommandsMap = require("./subcommands/fantasy-sub");

module.exports = {
  allowedRoles: [],
  allowedChannels: [FANTASY_MAIN],
  data: new SlashCommandBuilder()
    .setName("fantasy")
    .setDescription("Fantasy Manager")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("join")
        .setDescription("Join the Fantasy League")
        .addStringOption((option) =>
          option.setName("team").setRequired(true).setDescription("Team Name")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("me").setDescription("View your fantasy dashboard")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("edit")
        .setDescription("Edit your fantasy lineup")
        .addStringOption((option) =>
          option.setName("player-1").setDescription("Player 1")
        )
        .addStringOption((option) =>
          option.setName("player-2").setDescription("Player 2")
        )
        .addStringOption((option) =>
          option.setName("player-3").setDescription("Player 3")
        )
        .addStringOption((option) =>
          option.setName("player-4").setDescription("Player 2")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("other")
        .setDescription("View another player's team")
        .addStringOption((option) =>
          option.setName("player-name").setDescription("Player Name")
        )
    ),

  async execute(interaction) {
    const subCommandName = interaction.options.getSubcommand();

    const command = subCommandsMap.get(subCommandName);

    if (!command)
      throw new CommandError("Invalid Command", "That Command does not exist");

    await command(interaction);
  },
};
