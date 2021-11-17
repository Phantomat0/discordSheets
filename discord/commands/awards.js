const { SlashCommandBuilder } = require("@discordjs/builders");
const { AWARD_VOTING_ID } = require("../config/channels");
const { CommandError, InvalidPermissionError } = require("../utils/errors");
const mainDatabase = require("../../database/main/main");
const { successEmbedCreator } = require("../utils/embeds");

const BEST_PLAYERS_D1 = [
  ["abe", "abe"],
  ["DiMiliano", "dimiliano"],
  ["father", "father"],
  ["kermit", "kermit"],
  ["Murphy", "murphy"],
  ["Shiver", "shiver"],
  ["Shott", "shott"],
];

const BEST_PLAYERS_D2 = [
  ["Brian", "brian"],
  ["bronny", "bronny"],
  ["Daiki", "daiki"],
  ["Matt", "matt"],
  ["salah", "salah"],
  ["silva", "silva"],
  ["SmQcked", "smqcked"],
  ["TeeHee", "teehee"],
];

const ST_PLAYERS_D1 = [
  ["bek", "bek"],
  ["Bronny", "bronny"],
  ["DiMiliano", "dimiliano"],
  ["El JeFe", "el_jefe"],
  ["h", "h"],
  ["Murphy", "murphy"],
  ["salah", "salah"],
];

const AM_PLAYERS_D1 = [
  ["bennett", "bennett"],
  ["Cookie", "cookie"],
  ["kermit", "kermit"],
  ["Shiver", "shiver"],
  ["Shott", "shott"],
];

const DM_PLAYERS_D1 = [
  ["abe", "abe"],
  ["father", "father"],
  ["TDA", "tda"],
];

const GK_PLAYERS_D1 = [
  ["Chance", "chance"],
  ["is it xmas yet?", "is-it-xmas-yet?"],
  ["silva", "silva"],
  ["sixer", "sixer"],
];

const ST_PLAYERS_D2 = [
  ["bronny", "bronny"],
  ["cnb", "cnb"],
  ["crust", "crust"],
  ["EasyBruh", "easybruh"],
  ["kona", "kona"],
  ["PgN", "PgN"],
  ["salah", "salah"],
];

const AM_PLAYERS_D2 = [
  ["cargo", "carrgo"],
  ["Daiki", "daiki"],
  ["OMG RONNY", "omg-ronny"],
  ["SK1NNY", "SK1NNY"],
  ["Suzuki", "suzuki"],
];

const DM_PLAYERS_D2 = [
  ["Matt", "matt"],
  ["MIKASA", "mikasa"],
  ["nvg", "nvg"],
  ["SmQcked", "smqcked"],
];

const GK_PLAYERS_D2 = [
  ["Aoi", "aoi"],
  ["BOBBA", "bobba"],
  ["Brian", "brian"],
  ["richy", "richy"],
  ["silva", "silva"],
  ["TeeHee", "teehee"],
  ["wish", "wish"],
];

module.exports = {
  allowedRoles: [],
  allowedChannels: [AWARD_VOTING_ID],
  data: new SlashCommandBuilder()
    .setName("awards")
    .setDescription("Vote for Season 1 Awards")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("division_1")
        .setDescription("Division 1")
        .addStringOption((option) => {
          option
            .setRequired(true)
            .setName("best_player_1")
            .setDescription("Best Player Primary Pick");
          BEST_PLAYERS_D1.forEach(([name, id]) => option.addChoice(name, id));
          return option;
        })
        .addStringOption((option) => {
          option
            .setRequired(true)
            .setName("best_player_2")
            .setDescription("Best Player Secondary Pick");
          BEST_PLAYERS_D1.forEach(([name, id]) => option.addChoice(name, id));
          return option;
        })
        .addStringOption((option) => {
          option
            .setRequired(true)
            .setName("best_striker")
            .setDescription("Best Striker");
          ST_PLAYERS_D1.forEach(([name, id]) => option.addChoice(name, id));
          return option;
        })
        .addStringOption((option) => {
          option
            .setRequired(true)
            .setName("best_attacking_mid")
            .setDescription("Best Attacking Mid");
          AM_PLAYERS_D1.forEach(([name, id]) => option.addChoice(name, id));
          return option;
        })
        .addStringOption((option) => {
          option
            .setRequired(true)
            .setName("best_defensive_mid")
            .setDescription("Best Defensive Mid");
          DM_PLAYERS_D1.forEach(([name, id]) => option.addChoice(name, id));
          return option;
        })
        .addStringOption((option) => {
          option
            .setRequired(true)
            .setName("best_goalkeeper")
            .setDescription("Best Goalkeeper");
          GK_PLAYERS_D1.forEach(([name, id]) => option.addChoice(name, id));
          return option;
        })
        .addStringOption((option) =>
          option
            .setRequired(true)
            .setName("best_manager")
            .setDescription("Best General Manager")
            .addChoice("DiMiliano", "dimiliano")
            .addChoice("Shott", "shott")
            .addChoice("TDA", "tda")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("division_2")
        .setDescription("Division 2")
        .addStringOption((option) => {
          option
            .setRequired(true)
            .setName("best_player_1")
            .setDescription("Best Player Primary Pick");
          BEST_PLAYERS_D2.forEach(([name, id]) => option.addChoice(name, id));
          return option;
        })
        .addStringOption((option) => {
          option
            .setRequired(true)
            .setName("best_player_2")
            .setDescription("Best Player Secondary Pick");
          BEST_PLAYERS_D2.forEach(([name, id]) => option.addChoice(name, id));
          return option;
        })
        .addStringOption((option) => {
          option
            .setRequired(true)
            .setName("best_striker")
            .setDescription("Best Striker");
          ST_PLAYERS_D2.forEach(([name, id]) => option.addChoice(name, id));
          return option;
        })
        .addStringOption((option) => {
          option
            .setRequired(true)
            .setName("best_attacking_mid")
            .setDescription("Best Attacking Mid");
          AM_PLAYERS_D2.forEach(([name, id]) => option.addChoice(name, id));
          return option;
        })
        .addStringOption((option) => {
          option
            .setRequired(true)
            .setName("best_defensive_mid")
            .setDescription("Best Defensive Mid");
          DM_PLAYERS_D2.forEach(([name, id]) => option.addChoice(name, id));
          return option;
        })
        .addStringOption((option) => {
          option
            .setRequired(true)
            .setName("best_goalkeeper")
            .setDescription("Best Goalkeeper");
          GK_PLAYERS_D2.forEach(([name, id]) => option.addChoice(name, id));
          return option;
        })
    ),

  async execute(interaction) {
    const subCommandName = interaction.options.getSubcommand();

    // Validate that the player is registered for the league
    const playerProfile = await mainDatabase.getPlayerByDiscordID(
      interaction.user.id
    );

    if (!playerProfile)
      throw new InvalidPermissionError(
        "You must have been registered for this season to be able to vote"
      );

    const hasAlreadyVoted = await mainDatabase.checkIfVoted(
      subCommandName,
      playerProfile.player_id
    );
    // Validate that they havent already voted for that division

    if (hasAlreadyVoted)
      throw new CommandError(
        "Illegal vote",
        "You have already placed a vote for awards in that division."
      );

    processVotes(
      subCommandName,
      interaction.options,
      playerProfile.player_id,
      playerProfile.player_name
    );

    const successEmbed = successEmbedCreator(
      "Vote cast",
      "Your vote has been successfuly cast! Contact TDA if you need to change your vote."
    );

    await interaction.editReply({ embeds: [successEmbed] });
  },
};

function processVotes(divison, options, voterID, voterName) {
  const getVoteArray = () => {
    const bestPlayerOneOption = options.getString("best_player_1");
    const bestPlayerTwoOption = options.getString("best_player_2");
    const bestSTOption = options.getString("best_striker");
    const bestAMOption = options.getString("best_attacking_mid");
    const bestDMOption = options.getString("best_defensive_mid");
    const bestGKOption = options.getString("best_goalkeeper");

    if (bestPlayerOneOption === bestPlayerTwoOption)
      throw new CommandError(
        "Invalid selection,",
        "Primary and Secondary selections for Best Player cannot be the same"
      );

    const voteArray = [
      voterID,
      voterName,
      bestPlayerOneOption,
      bestPlayerTwoOption,
      bestSTOption,
      bestAMOption,
      bestDMOption,
      bestGKOption,
    ];

    if (divison === "divison_2") return voteArray;

    const bestManagerOption = options.getString("best_manager");

    return [...voteArray, bestManagerOption];
  };

  const voteArray = getVoteArray();

  mainDatabase.processAwardVotes(divison, voteArray);
}
