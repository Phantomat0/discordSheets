const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { MOD_LOG_ID } = require("../config/channels");
const { CommandError } = require("../utils/errors");
const { getDateTimeString } = require("../utils/utils");
const { MUTED_ROLE_ID } = require("../config/roles");
const { successEmbedCreator } = require("../utils/embeds");
const mainDatabase = require("../../database/main/main");

async function validateMute(interaction, discordMember) {
  // These roles cannot be muted
  const SAFE_ROLES = ["Admin", "Moderator", "Bot"];

  // Cant mute yourself
  if (interaction.user.id === discordMember.user.id)
    throw new CommandError("Invalid User", "You cannot unmute yourself");

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

  if (!isMuted) throw new CommandError("Cannot Mute", "User is not muted");
}

module.exports = {
  allowedRoles: ["Admin", "Moderator"],
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

    discordMember.roles.remove(MUTED_ROLE_ID);

    const successEmbed = successEmbedCreator(
      "Successfully unmuted!",
      `<@${discordMember.user.id}> has been unmuted`
    );

    const timeStamp = getDateTimeString();

    // Removing the muted user returns the database row
    const mutedObj = await mainDatabase.removeMutedUser(discordMember.user.id);

    const unmuteEmbed = new MessageEmbed()
      .setColor("GREEN")
      .setTitle(`Unmute`)
      .setDescription(
        `${
          mutedObj ? `[MuteLog](${mutedObj.message_link})\n` : ""
        }**User:** <@${discordMember.user.id}>\n**By:** <@${
          interaction.user.id
        }>\n\n*${timeStamp}*`
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
