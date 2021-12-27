const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { MOD_LOG_ID } = require("../config/channels");
const { CommandError } = require("../utils/errors");
const { plural, getDateTimeString } = require("../utils/utils");
const { Silence } = require("../utils/icons");
const { MODERATOR_ROLE_ID } = require("../config/roles");
const { successEmbedCreator } = require("../utils/embeds");
const { validateMute } = require("../utils/bot-utils");
const ms = require("ms");

const INFRACTIONS = {
  spam: {
    name: "Spamming",
    duration: 1,
  },
  mass_mention: {
    name: "Mass Mention",
    duration: 2,
  },
  dangerous_content: {
    name: "Dangerous Content",
    duration: 24,
  },
  racial_slur: {
    name: "Racial Slur",
    duration: 72,
  },
  harassment: {
    name: "Harassment",
    duration: 48,
  },
  threat: {
    name: "Threat",
    duration: 48,
  },
  disruptive_behaviour: {
    name: "Disruptive Behaviour",
    duration: 1,
  },
  cmd_abuse: {
    name: "Command or Channel Abuse",
    duration: 48,
  },
};

module.exports = {
  allowedRoles: [MODERATOR_ROLE_ID],
  allowedChannels: [],
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mute a User")
    .addUserOption((option) =>
      option.setName("target-user").setDescription("The user").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("infraction")
        .setDescription("Rule infraction committed")
        .addChoice("Spam", "spam")
        .addChoice("Mass mention", "mass_mention")
        .addChoice("Dangerous Content", "dangerous_content")
        .addChoice("Racial Slur", "racial_slur")
        .addChoice("Harassment", "harassment")
        .addChoice("Threat", "threat")
        .addChoice("Disruptive Behaviour", "disruptive_behaviour")
        .addChoice("Channel or command abuse", "cmd_abuse")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("info").setDescription("Additional info")
    ),

  async execute(interaction) {
    const { options } = interaction;

    const discordMember = options.getMember("target-user");

    const infractionTypeOption = options.getString("infraction");
    const infoOption = options.getString("info");

    const infraction = INFRACTIONS[infractionTypeOption];

    await validateMute(interaction, discordMember);

    const timeOutDurationInMs = ms(infraction.duration);

    // Invalid Times
    if (timeOutDurationInMs < 10000 || timeOutDurationInMs > 2419200000)
      throw new CommandError("Invalid Time", "Invalid Mute Duration");

    await discordMember.timeout(timeOutDurationInMs, infoOption);

    const successEmbed = successEmbedCreator(
      "Successfully Timed Out!",
      `<@${discordMember.user.id}> has been timed out`
    );

    const muteEmbed = new MessageEmbed()
      .setColor("RED")
      .setTitle(`Time out`)
      .setDescription(
        `**User:** <@${discordMember.user.id}>\n**Reason:** ${
          infraction.name
        }\n\n**By:** <@${interaction.user.id}>\n**Duration:** ${plural(
          infraction.duration,
          "hour",
          "hours"
        )}${
          infoOption ? `\n**Info:** ${infoOption}` : ""
        }\n\n*${getDateTimeString()}*`
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

    const muteChannelEmbed = new MessageEmbed()
      .setTitle(`${Silence} User has been timed out`)
      .setURL(modLogMessage.url)
      .setColor("RED")
      .setDescription(
        `<@${discordMember.user.id}> was timed out by <@${interaction.user.id}>`
      );

    interaction.followUp({
      embeds: [muteChannelEmbed],
    });

    // OLD MUTE

    // await validateMute(interaction, discordMember);

    // discordMember.roles.add(MUTED_ROLE_ID);

    // const infraction = INFRACTIONS[infractionTypeOption];

    // const successEmbed = successEmbedCreator(
    //   "Successfully Muted!",
    //   `<@${discordMember.user.id}> has been muted`
    // );

    // const timeStamp = getDateTimeString();

    // const muteEmbed = new MessageEmbed()
    //   .setColor("RED")
    //   .setTitle(`Mute`)
    //   .setDescription(
    //     `**User:** <@${discordMember.user.id}>\n**Reason:** ${
    //       infraction.name
    //     }\n\n**By:** <@${interaction.user.id}>\n**Duration:** ${plural(
    //       infraction.duration,
    //       "hour",
    //       "hours"
    //     )}${infoOption ? `\n**Info:** ${infoOption}` : ""}\n\n*${timeStamp}*`
    //   );

    // await interaction.editReply({
    //   embeds: [successEmbed],
    // });

    // const modLogMessage = await interaction.client.channels.cache
    //   .get(MOD_LOG_ID)
    //   .send({
    //     content: `<@${discordMember.user.id}>`,
    //     embeds: [muteEmbed],
    //   });

    // mainDatabase.addUserToMuted({
    //   muted_id: discordMember.user.id,
    //   muted_name: discordMember.user.username,
    //   muted_by_id: interaction.user.id,
    //   muted_by_name: interaction.user.username,
    //   time_of_mute: Date.now(),
    //   reason: infraction.name,
    //   duration: infraction.duration,
    //   info: infoOption,
    //   message_link: modLogMessage.url,
    // });

    // const muteChannelEmbed = new MessageEmbed()
    //   .setTitle(`${Silence} User has been muted`)
    //   .setURL(modLogMessage.url)
    //   .setColor("RED")
    //   .setDescription(
    //     `<@${discordMember.user.id}> was muted by <@${interaction.user.id}>`
    //   );

    // interaction.followUp({
    //   embeds: [muteChannelEmbed],
    // });
  },
};
