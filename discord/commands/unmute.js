const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { MOD_LOG_ID } = require("../config/channels");
const { getDateTimeString } = require("../utils/utils");
const { MODERATOR_ROLE_ID } = require("../config/roles");
const { successEmbedCreator } = require("../utils/embeds");
const { validateMute } = require("../utils/bot-utils");

module.exports = {
  allowedRoles: [MODERATOR_ROLE_ID],
  allowedChannels: [],
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Unmute a user")
    .addUserOption((option) =>
      option.setName("target-user").setDescription("The user").setRequired(true)
    ),

  async execute(interaction) {
    const { options } = interaction;

    const discordMember = options.getMember("target-user");

    await validateMute(interaction, discordMember);

    await discordMember.timeout(null);

    const successEmbed = successEmbedCreator(
      "Successfully unmuted!",
      `<@${discordMember.user.id}> has been unmuted`
    );

    const unmuteEmbed = new MessageEmbed()
      .setColor("GREEN")
      .setTitle(`Time out removed`)
      .setDescription(
        `**User:** <@${discordMember.user.id}>\n**By:** <@${
          interaction.user.id
        }>\n\n*${getDateTimeString()}*`
      );

    await interaction.editReply({
      embeds: [successEmbed],
    });

    await interaction.client.channels.cache.get(MOD_LOG_ID).send({
      content: `<@${discordMember.user.id}>`,
      embeds: [unmuteEmbed],
    });
  },
};
