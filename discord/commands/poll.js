const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { MOD_LOG_ID } = require("../config/channels");
const { CommandError } = require("../utils/errors");
const { plural, getDateTimeString } = require("../utils/utils");
const { Silence } = require("../utils/icons");
const { MUTED_ROLE_ID, MODERATOR_ROLE_ID } = require("../config/roles");
const { successEmbedCreator } = require("../utils/embeds");
const mainDatabase = require("../../database/main/main");

module.exports = {
  allowedRoles: [MODERATOR_ROLE_ID],
  allowedChannels: [],
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Outputs a poll")
    .addStringOption((option) =>
      option
        .setName("poll-title")
        .setDescription("Poll Title")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("option1").setDescription("Option 1")
    )
    .addStringOption((option) =>
      option.setName("option2").setDescription("Option 2")
    )
    .addStringOption((option) =>
      option.setName("option3").setDescription("Option 3")
    )
    .addStringOption((option) =>
      option.setName("option4").setDescription("Option 4")
    )
    .addStringOption((option) =>
      option.setName("option5").setDescription("Option 5")
    )
    .addStringOption((option) =>
      option.setName("option6").setDescription("Option 6")
    )
    .addStringOption((option) =>
      option.setName("option7").setDescription("Option 7")
    ),
  async execute(interaction) {
    const { options } = interaction;

    const discordMember = options.getMember("target-user");
    const infractionTypeOption = options.getString("infraction");
    const infoOption = options.getString("info");

    await validateMute(interaction, discordMember);

    discordMember.roles.add(MUTED_ROLE_ID);

    const infraction = INFRACTIONS[infractionTypeOption];

    const successEmbed = successEmbedCreator(
      "Successfully Muted!",
      `<@${discordMember.user.id}> has been muted`
    );

    const timeStamp = getDateTimeString();

    const muteEmbed = new MessageEmbed()
      .setColor("RED")
      .setTitle(`Mute`)
      .setDescription(
        `**User:** <@${discordMember.user.id}>\n**Reason:** ${
          infraction.name
        }\n\n**By:** <@${interaction.user.id}>\n**Duration:** ${plural(
          infraction.duration,
          "hour",
          "hours"
        )}${infoOption ? `\n**Info:** ${infoOption}` : ""}\n\n*${timeStamp}*`
      );

    await interaction.editReply({
      embeds: [successEmbed],
    });

    const modLogMessage = await interaction.client.channels.cache
      .get(MOD_LOG_ID)
      .send({
        content: `<@${discordMember.user.id}>`,
        embeds: [muteEmbed],
      });

    mainDatabase.addUserToMuted({
      muted_id: discordMember.user.id,
      muted_name: discordMember.user.username,
      muted_by_id: interaction.user.id,
      muted_by_name: interaction.user.username,
      time_of_mute: Date.now(),
      reason: infraction.name,
      duration: infraction.duration,
      info: infoOption,
      message_link: modLogMessage.url,
    });

    const muteChannelEmbed = new MessageEmbed()
      .setTitle(`${Silence} User has been muted`)
      .setURL(modLogMessage.url)
      .setColor("RED")
      .setDescription(
        `<@${discordMember.user.id}> was muted by <@${interaction.user.id}>`
      );

    interaction.followUp({
      embeds: [muteChannelEmbed],
    });
  },
};
