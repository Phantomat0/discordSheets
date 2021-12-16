const { SlashCommandBuilder } = require("@discordjs/builders");
const { ADMIN_BOT_ID } = require("../config/channels");
const { CommandError } = require("../utils/errors");
const subCommandsMap = require("./subcommands/admin-sub");
const { ADMIN_ROLE_ID } = require("../config/roles");

const D1TEAMS = [
  ["Dayton Futsal Club", "1"],
  ["Seoul Trains", "2"],
  ["Vicious VampS", "3"],
  ["Aces H.C.", "4"],
  ["Savage Hax", "5"],
  ["Haxball's Peak Futsal Team", "6"],
];

const D2TEAMS = [
  ["Dayton Futsal Academy", "7"],
  ["Busan Tigers", "8"],
  ["Ultimate Uzis", "9"],
  ["Spades H.C.", "10"],
  ["Imperial", "11"],
  ["Panda Academy", "12"],
];

const D3TEAMS = [
  ["Dayton New Player Academy", "13"],
  ["Incheon Impala", "14"],
  ["Lil Babys", "15"],
  ["Clovers H.C.", "16"],
  ["Pikachu Haxball Team", "17"],
  ["Haxball's Futsal Youth Academy", "18"],
];

module.exports = {
  allowedRoles: [ADMIN_ROLE_ID],
  allowedChannels: [ADMIN_BOT_ID],
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Admin Manager")
    .addSubcommand((subcommand) =>
      subcommand.setName("team").setDescription("View your team dashboard")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("appoint")
        .setDescription(
          "Appoint a player as a General Manager or Assistant of a Team"
        )
        .addStringOption((option) => {
          option.setName("team").setRequired(true).setDescription("Team");
          [...D1TEAMS, ...D2TEAMS, ...D3TEAMS].forEach((team) => {
            const [name, id] = team;
            option.addChoice(name, id);
          });

          return option;
        })
        .addStringOption((option) =>
          option
            .setName("position")
            .setDescription("Position you want to appoint")
            .addChoice("General Manager", "gm")
            .addChoice("Assistant Manager", "am")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("player_name")
            .setDescription("The player's name")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("waiversign")
        .setDescription("Sign a player through waivers")
        .addStringOption((option) => {
          option
            .setName("team")
            .setRequired(true)
            .setDescription("The player's team");
          [...D1TEAMS, ...D2TEAMS, ...D3TEAMS].forEach((team) => {
            const [name, id] = team;
            option.addChoice(name, id);
          });

          return option;
        })
        .addStringOption((option) =>
          option
            .setName("player_name")
            .setDescription("The player's name")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("trade")
        .setDescription("Announce a trade between two teams")
        .addStringOption((option) => {
          option.setName("team1").setDescription("Team 1").setRequired(true);
          D1TEAMS.forEach((team) => {
            const [name, id] = team;
            option.addChoice(name, id);
          });

          return option;
        })
        .addStringOption((option) => {
          option.setName("team2").setDescription("Team 2").setRequired(true);
          D1TEAMS.forEach((team) => {
            const [name, id] = team;
            option.addChoice(name, id);
          });

          return option;
        })
        .addStringOption((option) =>
          option.setName("stipulation").setDescription("Trade Stipulation")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("updateembeds")
        .setDescription("Updates the embeds in the Discord")
    ),

  async execute(interaction) {
    const subCommandName = interaction.options.getSubcommand();

    const command = subCommandsMap.get(subCommandName);

    if (!command)
      throw new CommandError("Invalid Command", "That Command does not exist");

    command(interaction);
  },
};
