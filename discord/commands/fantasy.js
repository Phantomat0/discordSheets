const { SlashCommandBuilder } = require("@discordjs/builders");
const { FANTASY_MAIN } = require("../config/channels");
const { CommandError } = require("../utils/errors");
const subCommandsMap = require("./subcommands/fantasy-sub");
const { FANTASY_ROLE_ID } = require("../config/roles");

module.exports = {
  allowedRoles: [FANTASY_ROLE_ID],
  allowedChannels: [FANTASY_MAIN],
  data: new SlashCommandBuilder()
    .setName("fantasy")
    .setDescription("Fantasy Manager")
    .addSubcommand((subcommand) =>
      subcommand.setName("me").setDescription("View your fantasy dashboard")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("edit")
        .setDescription("Edit your fantasy lineup")
        .addStringOption((option) =>
          option.setName("player-1").setDescription("Striker")
        )
        .addStringOption((option) =>
          option.setName("player-2").setDescription("Midfielder")
        )
        .addStringOption((option) =>
          option.setName("player-3").setDescription("Goalkeeper")
        )
        .addStringOption((option) =>
          option.setName("player-4").setDescription("FLEX")
        )
        .addStringOption((option) =>
          option.setName("player-5").setDescription("FLEX")
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
