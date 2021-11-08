const mainDatabase = require("../database/main/main");
const { getDiscordMember } = require("./bot-util");
const { MUTED_ROLE_ID } = require("./config/roles");

async function muteChecker(client) {
  const muted = await mainDatabase.getMutedUsers();

  console.log("RAN");

  const currrentTime = Date.now();

  muted.forEach(async (mutedUser) => {
    const timeOfMute = parseInt(mutedUser.time_of_mute);
    console.log(mutedUser);

    // Get the duration in hours in ms
    const secondsMuted = parseInt(mutedUser.duration) * 60000;
    const timeOfUnmute = timeOfMute + secondsMuted;

    const muteExpired = currrentTime > timeOfUnmute;

    console.log({ secondsMuted });
    console.log(timeOfUnmute, currrentTime);
    console.log(muteExpired, mutedUser.discord_name);

    if (muteExpired) {
      console.log("YUP HES UNMUTED NOW!!!");
      console.log(client);
      // Remove the role from the user, only if the user is still in the discord
      const discordMember = await getDiscordMember(
        client,
        mutedUser.discord_id
      );
      if (discordMember) {
        discordMember.roles.remove(MUTED_ROLE_ID);
        console.log("YAY!");
      }
    }
  });
}

module.exports = muteChecker;
