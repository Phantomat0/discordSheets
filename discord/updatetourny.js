const { MessageEmbed } = require("discord.js");
const mainDatabase = require("../database/main/main");
const { cache: CacheManager } = mainDatabase;

const getTournyPlayersEmbed = async () => {
  const PlayerManager = await new CacheManager(mainDatabase).loadCache(
    "players",
    mainDatabase.getPlayers
  );

  const tournyPlayers = await mainDatabase.getTournyPlayers();

  const playersString = tournyPlayers
    .map((player, index) => {
      const playerDiscordID = PlayerManager.getPlayer(
        player.player_id
      ).discord_id;
      return `${index + 1}. ${player.player_name} <@${playerDiscordID}>`;
    })
    .join("\n");

  return new MessageEmbed()
    .setTitle("6 Man Tournament Signups")
    .setDescription(playersString);
};

const updateTournyPlayers = async (client) => {
  const embed = await getTournyPlayersEmbed();

  const TOURNY_SIGNUP_LIST_ID = "905133164744310864";
  const TOURNY_SIGNUP_LIST_MESSAGE_ID = "905130017967726642";

  client.channels.cache
    .get(TOURNY_SIGNUP_LIST_ID)
    .messages.fetch(TOURNY_SIGNUP_LIST_MESSAGE_ID)
    .then((message) => message.edit({ embeds: [embed] }));
};

module.exports = updateTournyPlayers;
