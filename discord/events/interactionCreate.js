const {
  MessageEmbed,
  MessageSelectMenu,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const { FREE_AGENT_ROLE_ID } = require("../config/roles.json");
const {
  QuestionMark,
  PageCurled,
  WavingHand,
  SmallWhiteSquare,
  OkHand,
  X,
  GreenCheck,
} = require("../icons");
const mainDatabase = require("../../database/main/main");

const interactionManager = {
  async handleButton(interaction) {
    interaction.message.embeds[0].fields;
    console.log(interaction);

    const embedFields = interaction.message.embeds[0].fields;
    console.log(embedFields);
    const idField = embedFields.find((field) => {
      console.log(field);
      return field.name === "player_id";
    });

    const { value: playerID } = idField;

    const playerProfile = await mainDatabase.getPlayerByID(playerID);
    console.log(playerProfile);
    const discordProfile = await mainDatabase.getDiscordByPlayerID(playerID);
    console.log(discordProfile);
    const teamProfile = await mainDatabase.getTeam(
      playerProfile.current_team_id
    );
    console.log(teamProfile);

    const player = interaction.guild.members.cache.get(
      discordProfile.discord_id
    );
    player.roles.add(FREE_AGENT_ROLE_ID);
    player.roles.remove(teamProfile.role_id);

    const successEmbed = new MessageEmbed()
      .setColor("#75FF33")
      .setTitle(`${GreenCheck} Successful release`)
      .setDescription(
        `${playerProfile.player_name} has been released from the ${teamProfile.name} and is now a Free Agent.`
      );

    await interaction.update({
      embeds: [successEmbed],
      components: [],
    });

    // Ok once its successful release we have to:
    /*
1. Remove the players roleID DONE
2. Add the FA Role DONE
3. Change him teamID to 0

*/
  },
  async handleCommand(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);

      const errorEmbed = new MessageEmbed()
        .setColor("#C70039")
        .setTitle("Command Error")
        .setDescription("There was an error while executing this command!");

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  },
  async handleSelectmenu(interaction) {
    const { customId } = interaction;

    if (customId === "playerSelectRelease") {
      const { values } = interaction;

      // await interaction.deferReply({ ephemeral: true });

      const player = await mainDatabase.getPlayerByID(values[0]);
      const discordProfile = await mainDatabase.getDiscordByPlayerID(values[0]);

      console.log(player);

      const { discord_id, discord_avatar_url } = discordProfile;
      const { player_name, player_id, current_team_id } = player;

      console.log(player_name);

      const confirmButton = new MessageButton()
        .setCustomId("releaseConfirm")
        .setLabel("Confirm")
        .setStyle("SUCCESS");
      const cancelButton = new MessageButton()
        .setCustomId("cancelConfirm")
        .setLabel("Cancel")
        .setStyle("SECONDARY");

      const buttons = new MessageActionRow().addComponents(
        cancelButton,
        confirmButton
      );

      // Make the confirm message be the color of the team?
      const embed = new MessageEmbed()
        .setColor("RANDOM")
        .setTitle(`Are you sure you want to release ${player_name}?`)
        .setThumbnail(discord_avatar_url)
        .setDescription(`<@${discord_id}>`)
        .addFields(
          { name: "player_id", value: `${player_id}`, inline: true },
          { name: "team", value: `${current_team_id}`, inline: true }
        )
        .setTimestamp();

      // await interaction.editReply({
      //   embeds: [embed],
      //   components: [buttons],
      // });

      await interaction.update({
        embeds: [embed],
        components: [buttons],
      });
    }
  },
};

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.isCommand())
      return interactionManager.handleCommand(interaction);
    if (interaction.isSelectMenu())
      return interactionManager.handleSelectmenu(interaction);
    if (interaction.isButton())
      return interactionManager.handleButton(interaction);
  },
};
