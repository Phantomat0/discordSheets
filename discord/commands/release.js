const { SlashCommandBuilder } = require("@discordjs/builders");
const { RedTriangle, Warning } = require("../icons");
const mainDatabase = require("../../database/main/main");
const { MY_GM_ID } = require("../config/channels");
const {
  MessageEmbed,
  MessageActionRow,
  MessageSelectMenu,
} = require("discord.js");

module.exports = {
  perms: ["Admin", "General Manager"],
  data: new SlashCommandBuilder()
    .setName("release")
    .setDescription("Release a player from your team")
    .addStringOption((option) =>
      option
        .setName("division")
        .setDescription("Division")
        .setRequired(true)
        .addChoice("Division 1", "division_1")
        .addChoice("Division 2", "division_2")
    ),

  async execute(interaction) {
    try {
      if (interaction.channelId !== MY_GM_ID)
        throw {
          type: "Invalid Channel",
          message: `This command is only available in <#${MY_GM_ID}>`,
        };

      if (this.perms.length !== 0) {
        const hasPerms = interaction.member.roles.cache.some((role) =>
          this.perms.includes(role.name)
        );

        if (!hasPerms)
          throw {
            type: "Invalid Permissions",
            message: `You are not authorized to use that command!`,
          };

        // We have to get the players team_id by discord
        // Get the players teams
        // Get either D1 team or D2, depending on the selection

        const playerProfile = await mainDatabase.getPlayerByDiscordID(
          interaction.user.id
        );

        if (playerProfile === null)
          throw {
            type: "Invalid Permissions",
            message: `You are not registered as a player in the database`,
          };

        const { player_id } = playerProfile;

        const teamProfile = await mainDatabase.getManagersTeam(player_id);

        if (teamProfile === null)
          throw {
            type: "Invalid Permissions",
            message: `That team does not exist or you are not the General Manager of it`,
          };

        const divisionOption = interaction.options.getString("division");

        let teamPlayers = [];

        const { team_id, division_id } = teamProfile;

        console.log(divisionOption);
        console.log(teamProfile);

        if (divisionOption === "division_1") {
          console.log(division_id, "divID");
          // D2 GM trying to access D1 roster
          if (division_id == 2)
            throw {
              type: "Invalid Permissions",
              message: `You are not a manager of a D1 Team`,
            };
          console.log(team_id);
          teamPlayers = await mainDatabase.getPlayersByTeam(team_id);
        }

        if (divisionOption === "division_2") {
          // Is this guy the manager of a D1 team?

          console.log(division_id, "divid");

          if (division_id == 1) {
            // Show his D2 Team
            const affiliateTeam = await mainDatabase.getTeamsAffiliate(team_id);

            console.log(affiliateTeam);

            teamPlayers = await mainDatabase.getPlayersByTeam(
              affiliateTeam.team_id
            );
          } else {
            teamPlayers = await mainDatabase.getPlayersByTeam(team_id);
          }
        }

        // Find the team that this player manages

        // If he manages more than one team, throw an error

        // Once we find the team that he manages, check what option he selected

        // If d1, show his d1 team
        // If d2, show the players on his d2 team

        // Now we have to check if they selected D1 or D2

        // If the players main team is D2, we can skip this, since its automatic D2

        if (teamPlayers.length === 0)
          throw {
            type: "No players",
            message: `There are no active players on that team!`,
          };

        const messageSelect = new MessageSelectMenu()
          .setCustomId("playerSelectRelease")
          .setPlaceholder("No player selected")
          .setMinValues(1)
          .setMaxValues(1);

        // Now lets map that to the messageSelect options format
        const playerOptionsArray = teamPlayers.map((player) => {
          return {
            label: player.player_name,
            value: player.player_id,
          };
        });

        messageSelect.addOptions(playerOptionsArray);

        const playerSelectMenu = new MessageActionRow().addComponents(
          messageSelect
        );

        const selectEmbed = new MessageEmbed().setTitle(
          "Select a player to release"
        );

        await interaction.reply({
          embeds: [selectEmbed],
          components: [playerSelectMenu],
          ephemeral: true,
        });

        setTimeout(() => {
          const timeOutEmbed = new MessageEmbed().setTitle("Command timed out");
          interaction.editReply({
            embeds: [timeOutEmbed],
            components: [],
          });
        }, 15000);
      }
    } catch (error) {
      if (error?.type) {
        const commandErrorEmbed = new MessageEmbed()
          .setColor("#FF5733")
          .setTitle(`${RedTriangle} Command Error`)
          .setDescription(`${error.type}: ${error.message}`);

        interaction.reply({
          embeds: [commandErrorEmbed],
          ephemeral: true,
        });
      } else {
        console.log(error);
        const errorEmbed = new MessageEmbed().setTitle(
          `${Warning} There was an error`
        );

        interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true,
        });
      }

      return;
    }
  },
};
