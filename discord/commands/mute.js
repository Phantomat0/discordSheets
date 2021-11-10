const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { MOD_LOG_ID } = require("../config/channels");
const { CommandError } = require("../errors");
const { getDiscordMember, plural } = require("../bot-util");
const { MUTED_ROLE_ID } = require("../config/roles");
const { successEmbedCreator } = require("../embeds");
const mainDatabase = require("../../database/main/main");

async function validateMute(interaction, discordMember) {
  // These roles cannot be muted
  const SAFE_ROLES = ["Admin", "Moderator", "Bot"];

  console.log(discordMember);

  // Cant mute yourself
  if (interaction.user.id === discordMember.user.id)
    throw new CommandError("Invalid User", "You cannot mute yourself");

  // Cant mute invalid user
  if (!discordMember)
    throw new CommandError(
      "Invalid User",
      "User does not exist in this Discord"
    );

  // Mute a Moderator or Admin
  const attemptToMuteSafeRole = discordMember.roles.cache.some((role) =>
    SAFE_ROLES.includes(role.name)
  );

  if (attemptToMuteSafeRole)
    throw new CommandError("Invalid Mute", "User cannot be muted");

  // Mute someone who is already muted
  const isMuted = discordMember.roles.cache.some(
    (role) => role.name === "muted"
  );

  console.log(isMuted);

  if (isMuted) throw new CommandError("Cannot Mute", "User is already muted");
}

const infractions = {
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
};

module.exports = {
  allowedRoles: ["Admin", "Moderator"],
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
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("info").setDescription("Additional info")
    ),

  async execute(interaction) {
    const { options } = interaction;

    const userOption = options.getUser("target-user");
    const infractionTypeOption = options.getString("infraction");
    const infoOption = options.getString("info");

    const discordMember = await getDiscordMember(interaction, userOption.id);

    await validateMute(interaction, discordMember);

    discordMember.roles.add(MUTED_ROLE_ID);

    const infraction = infractions[infractionTypeOption];

    const successEmbed = successEmbedCreator(
      "Successful Mute!",
      `${discordMember.user.username} has been muted`
    );

    const muteEmbed = new MessageEmbed()
      .setColor("#f7e811")
      .setTitle(`Mute`)
      .setDescription(
        `**User:**<@${discordMember.user.id}>\n**Reason:** ${
          infraction.name
        }\n\n**By:** <@${interaction.user.id}>\n**Duration:** ${plural(
          infraction.duration,
          "hour",
          "hours"
        )}${infoOption ? `\n**Info:** ${infoOption}` : ""}`
      );

    const muted = await mainDatabase.getMutedUsers();

    mainDatabase.addUserToMuted({
      muted_id: discordMember.user.id,
      muted_name: discordMember.user.username,
      muted_by_id: interaction.user.id,
      muted_by_name: interaction.user.username,
      time_of_mute: Date.now(),
      reason: infraction.name,
      duration: infraction.duration,
      info: infoOption,
    });

    console.log(muted);

    interaction.editReply({
      embeds: [successEmbed],
      ephemeral: false,
    });

    // interaction.followUp({
    //   embeds: [successEmbed],
    // });

    interaction.client.channels.cache.get(MOD_LOG_ID).send({
      content: `<@${discordMember.user.id}>`,
      embeds: [muteEmbed],
    });

    // Now send to the mod log channel, and send the user a DM notifying them of their mute
  },
};
