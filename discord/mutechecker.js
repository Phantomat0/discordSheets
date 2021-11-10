const mainDatabase = require("../database/main/main");
const { getDiscordMember } = require("./bot-util");
const { MUTED_ROLE_ID } = require("./config/roles");
const { GUILD_ID } = require("./config/config");
const { MOD_LOG_ID } = require("./config/channels");
const { MessageEmbed } = require("discord.js");

async function muteChecker(client) {
  const muted = await mainDatabase.getMutedUsers();

  const currrentTime = Date.now();

  muted.forEach(async (mutedUser) => {
    const timeOfMute = parseInt(mutedUser.time_of_mute);

    // Get the duration in hours in ms
    const msMuted = parseInt(mutedUser.duration) * 60000;
    const timeOfUnmute = timeOfMute + msMuted;

    const muteExpired = currrentTime > timeOfUnmute;

    console.log({ msMuted });
    console.log(timeOfUnmute, currrentTime);
    console.log(muteExpired, mutedUser.discord_name);

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
          .setColor("#f77c11")
          .setTitle(`Unmute`)
          .setDescription(
            `**User:**<@${discordMember.user.id}>\n**By:** Bot Expired`
          );

        await client.channels.cache.get(MOD_LOG_ID).send({
          content: `<@${mutedUser.discord_id}>`,
          embeds: [unmutedEmbed],
        });
      }

      // Send message to Mod Log Channel
    }
  });
}

module.exports = muteChecker;
