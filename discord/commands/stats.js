const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const CacheManager = require("../../database/main/cachemanager");
const mainDatabase = require("../../database/main/main");
const { GENERAL_ID } = require("../config/channels");
const { CommandError } = require("../utils/errors");

const makeStatsEmbed = (statsProfile, TeamManager, divisionID) => {
  if (statsProfile === null) return null;
  const {
    player_name,
    team_id,
    games_played,
    time_played,
    goals,
    assists,
    goals_difference,
    gaa,
    cleansheets,
    wins,
    losses,
    fantasy_points,
    time_played_gk,
  } = statsProfile;

  const team = TeamManager.getTeamsDivisionAffiliate(team_id, divisionID);

  const convertDurationToStr = (timeString) => {
    const arr = timeString.split(":"); // splitting the string by colon

    const [hours, minutes, seconds] = arr;

    // Remove 0 pad

    const hoursInt = hours.startsWith("0") ? hours.substring(1) : hours;
    const minutesInt = minutes.startsWith("0") ? minutes.substring(1) : minutes;

    return `${hoursInt.length > 0 ? `${hoursInt}hrs ` : ""}${minutesInt}min`;
  };

  const timeString = convertDurationToStr(time_played);

  return new MessageEmbed()
    .setTitle(`${player_name}'s Stats`)
    .setDescription(
      `**Division ${divisionID}**\nTeam: ${
        team ? team.name : "Free Agent"
      }\n\nGames Played: ${games_played}\nTime Played: ${timeString}`
    )
    .setColor(team?.color)
    .setThumbnail(team?.logo_url)
    .addFields(
      { name: "Goals", value: goals, inline: true },
      { name: "Assists", value: assists, inline: true },
      { name: "+/-", value: goals_difference, inline: true },
      { name: "Cleansheets", value: cleansheets, inline: true },
      { name: "GAA", value: gaa, inline: true },
      { name: "W-L", value: `${wins}-${losses}`, inline: true },
      { name: "Fantasy Points", value: fantasy_points, inline: true }
    );
};

const getPlayerStatsEmbed = async (playerProfile) => {
  const TeamManager = await new CacheManager(mainDatabase).loadCache(
    "teams",
    mainDatabase.getTeams
  );

  const { statsProfileD1, statsProfileD2, statsProfileD3 } =
    await mainDatabase.getPlayerStats(playerProfile);

  const d1StatsEmbed = makeStatsEmbed(statsProfileD1, TeamManager, "1");
  const d2StatsEmbed = makeStatsEmbed(statsProfileD2, TeamManager, "2");
  const d3StatsEmbed = makeStatsEmbed(statsProfileD3, TeamManager, "3");

  return [d1StatsEmbed, d2StatsEmbed, d3StatsEmbed].filter((x) => !!x);
};

module.exports = {
  allowedRoles: [],
  allowedChannels: [GENERAL_ID],
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View a player stats profile")
    .addStringOption((option) =>
      option.setName("player-name").setDescription("Player Name")
    ),

  async execute(interaction) {
    const playerNameOption = interaction.options.getString("player-name");

    const getSelfStats = playerNameOption === null;

    const getStatsEmbedDependingOnOption = async () => {
      if (getSelfStats) {
        const playerProfile = await mainDatabase.getPlayerByDiscordID(
          interaction.user.id
        );

        if (!playerProfile)
          throw new CommandError(
            "Invalid Player",
            `You are not registered for the league`
          );

        return await getPlayerStatsEmbed(playerProfile);
      }
      console.log(playerNameOption);
      const playerProfile = await mainDatabase.getPlayerByName(
        playerNameOption
      );

      if (!playerProfile)
        throw new CommandError(
          "Invalid Player",
          `Player **${playerNameOption}** does not exist`
        );

      return await getPlayerStatsEmbed(playerProfile);
    };

    const statsEmbeds = await getStatsEmbedDependingOnOption();

    if (statsEmbeds.length === 0)
      throw new CommandError(
        "Invalid Player",
        `This player does not have any stats!`
      );

    interaction.editReply({
      embeds: statsEmbeds,
    });
  },
};
