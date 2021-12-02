const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const mainDatabase = require("../../database/main/main");
const { updateSignUpList } = require("../utils/bot-utils");
const { successEmbedCreator } = require("../utils/embeds");
const { FREE_AGENT_ROLE_ID } = require("../config/roles");
const { SIGNUP_ID, RECENT_SIGNUPS_ID } = require("../config/channels");

const PLAYER_POSITIONS = [
  ["ST", "ST"],
  ["AM", "AM"],
  ["DM", "DM"],
  ["GK", "GK"],
  ["ANY", "ANY"],
];

module.exports = {
  allowedRoles: [],
  allowedChannels: [SIGNUP_ID],
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register for the league")
    .addStringOption((option) =>
      option.setName("username").setDescription("Username").setRequired(true)
    )
    .addStringOption((option) => {
      option
        .setName("position")
        .setDescription("Your preferred position")
        .setRequired(true);

      PLAYER_POSITIONS.forEach((position) => {
        const [name, slug] = position;
        option.addChoice(name, slug);
      });

      return option;
    })
    .addIntegerOption((option) =>
      option
        .setName("availability")
        .setDescription(
          "Rate your availability with an integer between 1 and 10"
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("info").setDescription("Additional Info")
    ),
  async execute(interaction) {
    const playerName = interaction.options.getString("username");
    const availability = interaction.options.getInteger("availability");
    const position = interaction.options.getString("position");
    const info = interaction.options.getString("info");

    await mainDatabase.registerSignUp({
      discordID: interaction.user.id,
      playerName: playerName,
      position: position,
      availability: availability,
      info: info,
    });

    const signUpEmbed = new MessageEmbed()
      .setColor("RANDOM")
      .setAuthor(`${playerName}`, interaction.user.displayAvatarURL())
      .setDescription(`<@${interaction.user.id}>`)
      .addFields(
        { name: "Position", value: `${position}`, inline: true },
        {
          name: "Availability",
          value: `${availability}`,
          inline: true,
        }
      )
      .setTimestamp();

    if (info !== null && info.length > 1) {
      signUpEmbed.addField("Info", info, false);
    }
    await updateSignUpList(interaction.client);

    await interaction.client.channels.cache.get(RECENT_SIGNUPS_ID).send({
      embeds: [signUpEmbed],
    });

    await interaction.member.roles.add(FREE_AGENT_ROLE_ID);

    await interaction.editReply({
      embeds: [
        successEmbedCreator(
          "You are now signed up!",
          "If you need to remove your signup or modify it, please DM <@296070049062584321>"
        ),
      ],
    });
  },
};
