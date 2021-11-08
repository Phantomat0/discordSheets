const { MessageEmbed } = require("discord.js");
const { Warning } = require("../icons");
const { validateCommandRolesAndChannels } = require("../bot-util");
const { BOT_ERROR_ID } = require("../config/channels");

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
]);

const handleCommand = async (interaction) => {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) return;
  await interaction.deferReply({ ephemeral: true });

  try {
    validateCommandRolesAndChannels(
      interaction,
      command.allowedRoles,
      command.allowedChannels
    );
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
        interaction.client.channels.cache.get(BOT_ERROR_ID).send({
          content: error.message,
        });

        console.log(error, "yup");
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
      button.execute(interaction);
    }
  },
};
