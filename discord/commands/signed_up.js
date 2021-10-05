const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Sheet = require("../../sheets/sheet");

module.exports = {
  data: new SlashCommandBuilder().setName("list").setDescription("Shows stuff"),
  async execute(interaction) {
    const signedUpPlayers = await Sheet.getFreeAgents();

    const signedUpPlayersStr = signedUpPlayers
      .map((signUpArray) => {
        const [, , timeStampStr, name, position, availability, info = null] =
          signUpArray;
        return `${name}  [${availability}]`;
      })
      .join("\n");

    const signedUpPlayersEmbed = new MessageEmbed()
      .setTitle("Draft Signups")
      .setDescription(
        `
        **Players: ${signedUpPlayers.length}**
        ${signedUpPlayersStr}
        `
      );

    console.log(signedUpPlayersEmbed);

    await interaction.reply({
      embeds: [signedUpPlayersEmbed],
      ephemeral: true,
    });
  },
};
