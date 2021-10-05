const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const mainDatabase = require("../../database/main/main");
const { updateSignUpList } = require("../bot-util");
const { GreenCheck, RedTriangle } = require("../icons");

const PLAYER_POSITIONS = [
  ["ST", "ST"],
  ["AM", "AM"],
  ["DM", "DM"],
  ["GK", "GK"],
  ["ANY", "ANY"],
];

module.exports = {
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
  async execute(interaction, bot) {
    const playerName = interaction.options.getString("username");
    const availability = interaction.options.getInteger("availability");
    const position = interaction.options.getString("position");
    const info = interaction.options.getString("info");

    await interaction.deferReply({ ephemeral: true });

    try {
      await mainDatabase.registerSignUp({
        discordID: interaction.user.id,
        discordName: interaction.user.username,
        discordAvatarURL: interaction.user.displayAvatarURL(),
        playerName: playerName,
        position: position,
        availability: availability,
        info: info,
      });
    } catch (error) {
      console.log(error);
      if (error?.type === "Registration Error") {
        const errorEmbed = new MessageEmbed()
          .setColor("#FF5733")
          .setTitle(`${RedTriangle} Registration Error`)
          .setDescription(`${error.message}`);

        await interaction.editReply({
          embeds: [errorEmbed],
        });
        return;
      }
    }

    const successEmbed = new MessageEmbed()
      .setColor("#75FF33")
      .setTitle(`${GreenCheck} You are now signed up!`)
      .setDescription(
        "If you need to remove your signup or modify it, please DM <@296070049062584321>"
      );

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
    await updateSignUpList(bot);

    const CHANNEL_ID = "894607908942278737";

    await bot.channels.cache.get(CHANNEL_ID).send({
      embeds: [signUpEmbed],
    });

    const FA_ROLE_ID = "892959397280620624";

    await interaction.member.roles.add(FA_ROLE_ID);

    await interaction.editReply({
      embeds: [successEmbed],
    });
  },
};
