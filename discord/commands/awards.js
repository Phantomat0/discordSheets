const { SlashCommandBuilder } = require("@discordjs/builders");
const { AWARD_VOTING_ID } = require("../config/channels");
const { CommandError, InvalidPermissionError } = require("../utils/errors");
const mainDatabase = require("../../database/main/main");
const { successEmbedCreator } = require("../utils/embeds");

const ST_PLAYERS_D1 = [
  ["bennett", "bennett"],
  ["bronny", "bronny"],
  ["cargo", "cargo"],
  ["Dimiliano", "dimiliano"],
  ["EasyBruh", "EasyBruh"],
  ["kermit", "kermit"],
  ["Levaldo", "levaldo"],
  ["question", "question"],
  ["salah", "salah"],
];

const AM_PLAYERS_D1 = [
  ["abe", "abe"],
  ["Kl", "Kl"],
  ["soapy", "soapy"],
];

const DM_PLAYERS_D1 = [
  ["Dime", "dime"],
  ["father", "father"],
  ["Game Awn", "Game Awn"],
  ["Matt", "matt"],
  ["sw1zy", "sw1zy"],
  ["tda", "tda"],
];

const GK_PLAYERS_D1 = [
  ["Brian", "brian"],
  ["Firder", "firder"],
  ["pakito", "pakito"],
  ["silva", "silva"],
  ["sixer", "sixer"],
  ["sqai", "sqai"],
  ["is it xmas yet?", "xmas"],
  ["zippy", "zippy"],
];

const ST_PLAYERS_D2 = [
  ["Agent", "agent"],
  ["anak", "anak"],
  ["archie", "archie"],
  ["bronny", "bronny"],
  ["cargo", "cargo"],
  ["EasyBruh", "easybruh"],
  ["lets dye this world", "lets"],
  ["salah", "salah"],
  ["salina", "salina"],
];

const AM_PLAYERS_D2 = [
  ["Firder", "firder"],
  ["Gerardosky", "gerardosky"],
  ["nik", "nik"],
  ["question", "question"],
  ["sqai", "sqai"],
  ["Suzuki", "Suzuki"],
];

const DM_PLAYERS_D2 = [
  ["Dani", "dani"],
  ["Dazai", "dazai"],
  ["ellio12", "ellio"],
  ["Faraone", "faraone"],
  ["Matt", "matt"],
  ["ceedee lamb", "pennutoh"],
];

const GK_PLAYERS_D2 = [
  ["ABECE", "abece"],
  ["Aoi", "aoi"],
  ["Ben Bishop", "ben bishop"],
  ["BOBBA", "bobba"],
  ["Brian", "brian"],
  ["darksqde", "darksqde"],
  ["EasyBruh", "easyBruh"],
  ["hashem", "hashem"],
  ["silva", "silva"],
  ["Tyler Herro", "tyler herro"],
  ["zippy", "zippy"],
];

const BEST_PLAYERS_D1 = [
  ["bennett", "bennett"],
  ["Dimiliano", "dimiliano"],
  ["Kl", "kl"],
  ["Matt", "matt"],
  ["sixer", "sixer"],
  ["sw1zy", "sw1zy"],
  ["is it xmas yet?", "xmas"],
];

const BEST_PLAYERS_D2 = [
  ["Brian", "brian"],
  ["bronny", "bronny"],
  ["cargo", "cargo"],
  ["Dani", "dani"],
  ["Gerardosky", "gerardosky"],
  ["lets dye this world", "lets"],
  ["question", "question"],
  ["salah", "salah"],
  ["Suzuki", "suzuki"],
  ["Tyler Herro", "tyler herro"],
];

const BEST_PLAYERS_D3 = [
  ["Agent", "agent"],
  ["Apathy", "apathy"],
  ["Ben Bishop", "ben bishop"],
  ["darksqde", "darksqde"],
  ["EasyBruh", "easybruh"],
  ["harry kane", "harry kane"],
  ["hashem", "hashem"],
  ["Incital", "incital"],
  ["ratchet", "ratchet"],
  ["Raz", "raz"],
  ["richy", "richy"],
];

module.exports = {
  allowedRoles: [],
  allowedChannels: [AWARD_VOTING_ID],
  data: new SlashCommandBuilder()
    .setName("awards")
    .setDescription("Vote for Season 2 Awards")
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
            .setDescription("Best Manager")
            .addChoice("Brian", "brian")
            .addChoice("DiMiliano", "dimiliano")
            .addChoice("Matt", "matt")
            .addChoice("sixer", "sixer")
            .addChoice("sqai", "sqai")
            .addChoice("zippy", "zippy")
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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("division_3")
        .setDescription("Division 3")
        .addStringOption((option) => {
          option
            .setRequired(true)
            .setName("best_player_1")
            .setDescription("Best Player Primary Pick");
          BEST_PLAYERS_D3.forEach(([name, id]) => option.addChoice(name, id));
          return option;
        })
        .addStringOption((option) => {
          option
            .setRequired(true)
            .setName("best_player_2")
            .setDescription("Best Player Secondary Pick");
          BEST_PLAYERS_D3.forEach(([name, id]) => option.addChoice(name, id));
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
  const bestPlayerOneOption = options.getString("best_player_1") ?? null;
  const bestPlayerTwoOption = options.getString("best_player_2") ?? null;

  if (bestPlayerOneOption === bestPlayerTwoOption)
    throw new CommandError(
      "Invalid selection",
      "Primary and Secondary selections for Best Player cannot be the same"
    );

  if (divison === "divison_3") {
    const voteArray = [
      voterID,
      voterName,
      bestPlayerOneOption,
      bestPlayerTwoOption,
    ];

    mainDatabase.processAwardVotes(divison, voteArray);

    return;
  }

  const getVoteArray = () => {
    const bestSTOption = options.getString("best_striker");
    const bestAMOption = options.getString("best_attacking_mid");
    const bestDMOption = options.getString("best_defensive_mid");
    const bestGKOption = options.getString("best_goalkeeper");

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
