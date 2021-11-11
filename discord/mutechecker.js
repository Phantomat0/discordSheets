const mainDatabase = require("../database/main/main");
const { getDiscordMember } = require("./utils/bot-utils");
const { MUTED_ROLE_ID } = require("./config/roles");
const { GUILD_ID } = require("./config/config");
const { MOD_LOG_ID } = require("./config/channels");
const { MessageEmbed } = require("discord.js");

async function muteChecker(client) {
  const muted = await mainDatabase.getMutedUsers();

  const currrentTime = Date.now();

  muted.forEach(async (mutedUser) => {
    const timeOfMute = parseInt(mutedUser.time_of_mute);

    const MS_IN_AN_HOUR = 3600000;

    // Get the duration in hours in ms
    const msMuted = parseInt(mutedUser.duration) * MS_IN_AN_HOUR;
    const timeOfUnmute = timeOfMute + msMuted;

    const muteExpired = currrentTime > timeOfUnmute;

    if (muteExpired) {
      // Remove from database
      mainDatabase.removeMutedUser(mutedUser.discord_id);

      // Remove the role from the user, only if the user is still in the discord
      const discordMember = await getDiscordMember(
        null,
        mutedUser.discord_id,
        client.guilds.cache.get(GUILD_ID)
      );
      if (discordMember) {
        discordMember.roles.remove(MUTED_ROLE_ID);

        const unmutedEmbed = new MessageEmbed()
          .setColor("GREEN")
          .setTitle(`Unmute`)
          .setDescription(
            `**User:**<@${discordMember.user.id}>\n**By:** <@${client.user.id}> (Mute Expired)`
          );

        // Send message to Mod Log Channel
        await client.channels.cache.get(MOD_LOG_ID).send({
          content: `<@${mutedUser.discord_id}>`,
          embeds: [unmutedEmbed],
        });
      }
    }
  });
}

module.exports = muteChecker;
