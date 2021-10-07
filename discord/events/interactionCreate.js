const {
  MessageEmbed,
  MessageSelectMenu,
  MessageActionRow,
  MessageButton,
  Interaction,
} = require("discord.js");
const { FREE_AGENT_ROLE_ID } = require("../config/roles");
const { TRANSACTIONS_ID } = require("../config/channels");
const {
  QuestionMark,
  PageCurled,
  WavingHand,
  SmallWhiteSquare,
  OkHand,
  X,
  GreenCheck,
  Warning,
} = require("../icons");
const mainDatabase = require("../../database/main/main");

const interactionManager = {
  async handleButton(interaction) {
    const { customId } = interaction;

    if (customId === "releaseConfirm") {
      const embedFields = interaction.message.embeds[0].fields;
      const idField = embedFields.find((field) => field.name === "player_id");

      const { value: playerID } = idField;

      const playerProfile = await mainDatabase.getPlayerByID(playerID);
      const discordProfile = await mainDatabase.getDiscordByPlayerID(playerID);
      const teamProfile = await mainDatabase.getTeam(
        playerProfile.current_team_id
      );

      const playerBeingReleasedDiscord =
        interaction.guild.members.cache.get(discordProfile.discord_id) ?? null;

      playerBeingReleasedDiscord?.roles.add(FREE_AGENT_ROLE_ID);
      playerBeingReleasedDiscord?.roles.remove(teamProfile.role_id);

      // Change his team in the database, 0 is the no team role
      mainDatabase.updatePlayerTeam(playerProfile.player_id, 0);

      const successEmbed = new MessageEmbed()
        .setColor("#75FF33")
        .setTitle(`${GreenCheck} Successful release`)
        .setDescription(
          `${playerProfile.player_name} has been released from the **${teamProfile.name}** and is now a Free Agent.`
        )
        .setTimestamp();

      const releaseEmbed = new MessageEmbed()
        .setColor(teamProfile.color)
        .setAuthor(
          `The ${teamProfile.name} release ${playerProfile.player_name}`,
          teamProfile.logo_url
        )
        .setDescription(`<@${discordProfile.discord_id}> is now a Free Agent.`)
        .setTimestamp()
        .setFooter(
          `${interaction.user.username}`,
          interaction.user.displayAvatarURL()
        );

      await interaction.client.channels.cache.get(TRANSACTIONS_ID).send({
        embeds: [releaseEmbed],
      });

      if (playerBeingReleasedDiscord === null) {
        successEmbed.addField(
          "Note",
          `${playerProfile.player_name} is no longer in the Discord`
        );
      }

      // Now we just have to change his team in the database

      const timeOutEmbed = new MessageEmbed().setTitle("Command Complete");

      await interaction.update({
        embeds: [timeOutEmbed],
        components: [],
      });

      await interaction.followUp({
        embeds: [successEmbed],
        ephemeral: true,
      });
    }

    if (customId === "releaseCancel") {
      const cancelEmbed = new MessageEmbed().setTitle("Command Cancelled");

      await interaction.update({
        embeds: [cancelEmbed],
        components: [],
      });
    }
  },
  async handleCommand(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      const getErrorEmbed = () => {
        if (error.type) {
          return new MessageEmbed()
            .setColor(error.color)
            .setTitle(error.name)
            .setDescription(error.getMessage());
        } else {
          console.log(error);
          return new MessageEmbed()
            .setColor("#C70039")
            .setTitle(`${Warning} Command Error`)
            .setDescription("There was an error while executing this command!");
        }
      };

      const errorEmbed = getErrorEmbed();

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

      const player = await mainDatabase.getPlayerByID(values[0]);
      const discordProfile = await mainDatabase.getDiscordByPlayerID(values[0]);

      const { discord_id, discord_avatar_url } = discordProfile;
      const { player_name, player_id, current_team_id } = player;

      const teamProfile = await mainDatabase.getTeam(current_team_id);

      const confirmButton = new MessageButton()
        .setCustomId("releaseConfirm")
        .setLabel("Confirm")
        .setStyle("SUCCESS");
      const cancelButton = new MessageButton()
        .setCustomId("releaseCancel")
        .setLabel("Cancel")
        .setStyle("SECONDARY");

      const buttons = new MessageActionRow().addComponents(
        cancelButton,
        confirmButton
      );

      const embed = new MessageEmbed()
        .setColor("RANDOM")
        .setTitle(`Are you sure you want to release ${player_name}?`)
        .setThumbnail(discord_avatar_url)
        .setDescription(`<@${discord_id}>`)
        .addFields(
          { name: "player_id", value: `${player_id}`, inline: true },
          { name: "team", value: `${teamProfile.name}`, inline: true }
        );

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
