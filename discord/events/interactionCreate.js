const { MessageEmbed } = require("discord.js");
const { Warning } = require("../utils/icons");
const { BOT_ERROR_ID } = require("../config/channels");
const { InvalidPermissionError } = require("../utils/errors");
const {
  ANNOUNCEMENT_ROLE_ID,
  SCORES_ROLE_ID,
  MEDIA_ROLE_ID,
  MODERATOR_ROLE_ID,
  DONATOR_ROLE_ID,
} = require("../config/roles");

const validateCommandChannels = (interaction, allowedChannels) => {
  if (allowedChannels.length === 0) return true;

  // Lets map all the available channels to a string and format it to help the user
  const availableChannelsStr = allowedChannels
    .map((channelID) => `<#${channelID}>`)
    .join(", ");

  if (!allowedChannels.includes(interaction.channelId))
    throw new InvalidPermissionError(
      `This command is not available in this channel, try using it in one of the following channels: ${availableChannelsStr}`
    );
};

const roleMap = new Map([
  ["announcement", ANNOUNCEMENT_ROLE_ID],
  ["media", MEDIA_ROLE_ID],
  ["scores", SCORES_ROLE_ID],
]);

const addRole = (interaction, roleName) => {
  const discordMember = interaction.member;

  const roleToGive = roleMap.get(roleName);

  if (!roleToGive) return;

  const hasRole = discordMember.roles.cache.some(
    (role) => role.id == roleToGive
  );

  if (hasRole) {
    discordMember.roles.remove(roleToGive);
  } else {
    discordMember.roles.add(roleToGive);
  }
};

const buttonInteractions = new Map([
  [
    "cancel",
    {
      async execute(interaction) {
        const cancelEmbed = new MessageEmbed().setTitle(
          "Command Action Cancelled"
        );

        await interaction.update({
          embeds: [cancelEmbed],
          components: [],
        });
      },
    },
  ],
  [
    "announcement",
    {
      async execute(interaction) {
        addRole(interaction, "announcement");
      },
    },
  ],
  [
    "media",
    {
      async execute(interaction) {
        addRole(interaction, "media");
      },
    },
  ],
]);

const handleCommand = async (interaction) => {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) return;
  await interaction.deferReply({ ephemeral: true });

  try {
    validateCommandChannels(interaction, command.allowedChannels);
    // Future can have different timeouts for each command
    await command.execute(interaction);
  } catch (error) {
    const getErrorEmbed = () => {
      if (error.type) {
        return new MessageEmbed()
          .setColor(error.color)
          .setTitle(error.name)
          .setDescription(error.getMessage());
      } else {
        console.log("ERROR IN INTERACTION CREATE");
        console.log(error);
        interaction.client.channels.cache.get(BOT_ERROR_ID).send({
          content: error.message,
        });

        return new MessageEmbed()
          .setColor("#C70039")
          .setTitle(`${Warning} Command Error`)
          .setDescription("There was an error while executing this command!");
      }
    };

    console.log("ERROR");

    const errorEmbed = getErrorEmbed();

    await interaction.editReply({
      embeds: [errorEmbed],
      ephemeral: true,
    });
  }
};

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    const { customId } = interaction;
    if (interaction.isCommand()) await handleCommand(interaction);
    // if (interaction.isSelectMenu()) {
    //   const selectMenu = selectMenuInteractions.get(customId);
    //   if (!selectMenu) return;
    //   selectMenu.execute(interaction);
    // }
    if (interaction.isButton()) {
      const button = buttonInteractions.get(customId);
      if (!button) return;
      interaction.deferUpdate();
      button.execute(interaction);
    }
  },
};
