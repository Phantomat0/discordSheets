const { SlashCommandBuilder } = require("@discordjs/builders");
const { MY_GM_ID } = require("../config/channels");
const { CommandError } = require("../utils/errors");
const subCommandsMap = require("./subcommands/gm-sub");
const {
  GENERAL_MANAGER_ROLE_ID,
  ASSISTANT_MANAGER_ROLE_ID,
} = require("../config/roles");

module.exports = {
  allowedRoles: [GENERAL_MANAGER_ROLE_ID, ASSISTANT_MANAGER_ROLE_ID],
  allowedChannels: [MY_GM_ID],
  data: new SlashCommandBuilder()
    .setName("gm")
    .setDescription("Team Manager")
    .addSubcommand((subcommand) =>
      subcommand.setName("team").setDescription("View your team dashboard")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("sign")
        .setDescription("Sign a player")
        .addStringOption((option) =>
          option
            .setName("division")
            .setDescription("Division")
            .addChoice("Division 1", "1")
            .addChoice("Division 2", "2")
            .addChoice("Division 3", "3")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("player_name")
            .setDescription("The player's name")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("release")
        .setDescription("Release a player")
        .addStringOption((option) =>
          option
            .setName("division")
            .setDescription("Division")
            .addChoice("Division 1", "1")
            .addChoice("Division 2", "2")
            .addChoice("Division 3", "3")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("waiver")
        .setDescription("Place a waiver claim")
        .addStringOption((option) =>
          option
            .setName("division")
            .setDescription("Division")
            .addChoice("Division 1", "1")
            .addChoice("Division 2", "2")
            // .addChoice("Division 3", "3")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("player_name")
            .setDescription("The player's name")
            .setRequired(true)
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
