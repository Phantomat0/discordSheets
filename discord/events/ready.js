const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const mainDatabase = require("../../database/main/main");
const { INFORMATION_ID, REGISTRATION_ID } = require("../config/channels");
const { LOGO_URL } = require("../config/logo");
const { GUILD_ID } = require("../config/config");
const {
  ANNOUNCEMENT_ROLE_ID,
  MEDIA_ROLE_ID,
  SCORES_ROLE_ID,
  MODERATOR_ROLE_ID,
  DONATOR_ROLE_ID,
} = require("../config/roles");
const { CommandError } = require("../errors");
const {
  WavingHand,
  PageCurled,
  SmallWhiteSquare,
  QuestionMark,
  Bell,
  MoneyBag,
  Abascus,
} = require("../icons");
const { getCancelAndConfirmButtonRow } = require("../buttons");
const { successEmbedCreator } = require("../embeds");
const {
  sendInteractionCompleted,
  sendInteractionTimedOut,
} = require("../bot-util");

const updateTournyPlayers = require("../updatetourny");
const muteChecker = require("../mutechecker");
async function startSixMan(client) {
  return;
  const signUpButton = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId("sixManSignUp")
      .setStyle("PRIMARY")
      .setLabel("Sign me up!")
  );

  const signUpEmbed = new MessageEmbed()
    .setTitle("6 Man Rambo Signups!")
    .setDescription(
      "Sign up by clicking the button below!\n\n*Note: You must be signed up for the current season to be eligible to participate.*"
    );

  const SIXMAN_REGISTER_CHANNEL_ID = "905133164744310864";

  const currentChannel = await client.channels.cache.get(
    SIXMAN_REGISTER_CHANNEL_ID
  );

  await client.channels.cache.get(SIXMAN_REGISTER_CHANNEL_ID).send({
    embeds: [signUpEmbed],
  });

  await client.channels.cache.get(SIXMAN_REGISTER_CHANNEL_ID).send({
    embeds: [signUpEmbed],
    components: [signUpButton],
  });

  const signUpFilter = (ir) => ir.customId === "sixManSignUp";

  const collector = currentChannel.createMessageComponentCollector({
    filter: signUpFilter,
    componentType: "BUTTON",
  });

  collector.on("collect", async (buttonInteraction) => {
    const playerProfile = await mainDatabase.getPlayerByDiscordID(
      buttonInteraction.user.id
    );

    try {
      // First, check if this player is registered for the league

      if (!playerProfile)
        throw new CommandError(
          "Ineligible Signup",
          "You must be registered for the current season in order to play in this tournament"
        );

      const isSignedUp = await mainDatabase.checkIfSignedUpTournament(
        playerProfile.player_id
      );

      if (isSignedUp)
        throw new CommandError(
          "Ineligible Signup",
          "You are already signed up for this tournament."
        );
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

      console.log("ERROR");

      const errorEmbed = getErrorEmbed();

      await buttonInteraction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });

      return;
    }

    // Ok now show the confirm buttons

    const confirmEmbed = new MessageEmbed()
      .setColor("#f5dd42")
      .setTitle(`Confirm tournament entry`)
      .setDescription(`Are you sure you want to play in this tournament?`);

    const confirmCancelButtons = getCancelAndConfirmButtonRow("sixManConfirm");

    buttonInteraction.reply({
      ephemeral: true,
      embeds: [confirmEmbed],
      components: [confirmCancelButtons],
    });

    const buttonConfirmFilter = (ir) =>
      ir.user.id === buttonInteraction.user.id &&
      ir.customId === "sixManConfirm";

    const buttonConfirmCollector =
      buttonInteraction.channel.createMessageComponentCollector({
        filter: buttonConfirmFilter,
        componentType: "BUTTON",
        time: 15000,
        max: 1,
      });

    buttonConfirmCollector.on("collect", async (confirmInteraction) => {
      const discordMember = confirmInteraction.member;

      const SIX_MAN_ROLE_ID = "905116192501547058";

      discordMember.roles.add(SIX_MAN_ROLE_ID);

      sendInteractionCompleted(buttonInteraction);
      const successEmbed = successEmbedCreator("Successfully signed up!");

      await mainDatabase.registerPlayerTournament(playerProfile);

      await updateTournyPlayers(confirmInteraction.client);

      confirmInteraction.reply({
        ephemeral: true,
        embeds: [successEmbed],
      });
    });

    buttonConfirmCollector.on("end", async (collected) => {
      if (collected.size >= 1) return;
      sendInteractionTimedOut(buttonInteraction);
    });
  });
}

async function sendInformation(client) {
  const rolePings = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId("announcement")
      .setLabel("Announcement")
      .setStyle("PRIMARY"),
    new MessageButton()
      .setCustomId("media")
      .setLabel("Media")
      .setStyle("PRIMARY"),
    new MessageButton()
      .setCustomId("scores")
      .setLabel("Scores")
      .setStyle("PRIMARY")
  );

  const welcomeEmbed = new MessageEmbed()
    .setAuthor(
      "Official Website",
      LOGO_URL,
      "https://www.youtube.com/watch?v=UALYfVCLlYM"
    )
    .setTitle(`${WavingHand}  Welcome to American Futsal!`)
    .setColor("#FF0055")
    .setDescription(
      "North America's most profound futsal league!\n\nWe are a competitive 4v4 haxball league with two divisions and biweekly games. Additionally, we offer a 4v4 competitive ELO public room, a casual 3v3 room, and a 1v1 room."
    );

  const rulesArray = [
    "Spam",
    "Offensive nicknames",
    "Excessive mentioning of users and roles",
    "Links to dangerous or explicit websites",
    "Sexually explicit content",
    "Hate speech or racial slurs",
    "Images of gore and/or animal cruelty",
    "Harassment",
    "Advertising of other servers or websites",
    "Dox attempts or threats",
    "Threats of violence",
  ];

  const rulesStr = rulesArray
    .map((rule) => `${SmallWhiteSquare} ${rule}`)
    .join("\n\n");
  await client.guilds.cache.get(GUILD_ID).members.fetch();

  const moderatorsIdArray = await client.guilds.cache
    .get(GUILD_ID)
    .roles.cache.get(MODERATOR_ROLE_ID)
    .members.map((m) => m.user.id);

  const adminsArray = [
    {
      name: "TDA",
      discordID: "296070049062584321",
    },
    {
      name: "Creed",
      discordID: "732074447699181609",
    },
    {
      name: "salah",
      discordID: "391356195870605315",
    },
  ];

  const moderatorListStr = moderatorsIdArray.map((id) => `<@${id}>`).join("\n");
  const adminListStr = adminsArray
    .map((admin) => `${admin.name} <@${admin.discordID}>`)
    .join("\n");
  const staffEmbed = new MessageEmbed()
    .setTitle(`${Abascus}  Staff`)
    .setColor("#3f9630")
    .setDescription(
      `Want a clarification on rules? Want to report in game rule breaking? Contact an Admin.\n\nWant to report misconduct in the Discord, feel uncomortable or threatned, or just need any Discord help? Contact the moderator team and let them know.\n\n**Admins**\n${adminListStr}\n\n**Moderators**\n${moderatorListStr}`
    );

  const rulesEmbed = new MessageEmbed()
    .setTitle(`${PageCurled} Rules`)
    .setColor("#d9dbda")
    .setDescription(rulesStr);

  const faqEmbed = new MessageEmbed()
    .setTitle(`${QuestionMark} FAQ`)
    .setColor("#f52727")
    .addField(
      "How do I join a team?",
      `To join a team, you must first register for the league. Begin by going to <#${REGISTRATION_ID}> and using the /register command and filling out the form. From there, you wait to be picked up by a team.`,
      false
    )
    .addField(
      "What if I am an inexperienced or new player?",
      "Thankfully, the league is split into two divisions, D1 for more experienced players and D2 for intermediate/new players who are looking to prove themselves.",
      false
    )
    .addField(
      "When are games played?",
      `**D1** Tuesdays and Thursdays 7PM EST \n **D2** Tuesdays and Thursdays 6PM EST`,
      false
    )
    .addField(
      "I have a suggestion for the league and or want to help out with the league?",
      `You can post any suggestions in <#888561683520430130>. We are always open to players looking to offer to help in any way they can, please direct any such requests to an <@&887376620602671185>`,
      false
    )
    .addField(
      "Who do I contact regarding an issue with the public rooms?",
      `All public rooms are overseen by the <@&894715039687274516>`,
      false
    )
    .addField(
      "I was banned from one of the public rooms, how do I get unbanned?",
      `Post an appeal in <#895420435586482206> and patiently wait for a reply from a pub admin.`,
      false
    )
    .addField(
      "Who do I contact regarding an issue with the Discord?",
      `Any issues or concerns regarding the Discord should be forwared to any of the moderators listed above in the rules section. `,
      false
    )
    .addField(
      "Can I partner with this server and or advertise my own server here?",
      `No, AF server does not and will not partner with servers, will not advertise your server, and does not allow for server promotion in any of its channels.`,
      false
    );

  const CREED_DISCORD_ID = "732074447699181609";
  const PATREON_LINK = "https://www.patreon.com/creedhaxball";

  const donationEmbed = new MessageEmbed()
    .setTitle(`${MoneyBag} Donations`)
    .setColor("#badc58")
    .setDescription(
      `All public rooms, private matchrooms, and the website are fully hosted and coded by <@${CREED_DISCORD_ID}>. Although these services are provided free of charge, servers to run rooms and is an ongoing charge that eventually comes out of <@${CREED_DISCORD_ID}>'s pockets. \n\nTo help cover these charges, we offer a [donation pool](${PATREON_LINK}) in which all funds go to covering hosting fees. Although we will never force players to pay for our services, we kindly appreciate any sincere and generous donations. As a sign of our appreciation, donators will receive a few perks for their generosity: \n${SmallWhiteSquare} Special tag in rooms\n ${SmallWhiteSquare} Discord role <@${DONATOR_ROLE_ID}>\n${SmallWhiteSquare} Exclusive insight into future updates.\n\nContact <@${CREED_DISCORD_ID}> to confirm your donation and receive these perks. Thank you for your generosity.`
    );

  const notificationsEmbed = new MessageEmbed()
    .setTitle(`${Bell} Notifications`)
    .setColor("#FFAD33")
    .setDescription(
      `No one likes constant pings, thats why we only @everyone for league wide announcements.\n\nClick the appropriate button if you would like to be notified of other smaller announcements. Click again to remove the notification role.`
    );

  await client.channels.cache.get(INFORMATION_ID).send({
    embeds: [
      welcomeEmbed,
      rulesEmbed,
      faqEmbed,
      staffEmbed,
      donationEmbed,
      notificationsEmbed,
    ],
    components: [rolePings],
  });

  const currentChannel = await client.channels.cache.get(INFORMATION_ID);

  const collector = currentChannel.createMessageComponentCollector({
    componentType: "BUTTON",
  });

  collector.on("collect", async (buttonInteraction) => {
    const discordMember = buttonInteraction.member;

    const roleMap = new Map([
      ["announcement", ANNOUNCEMENT_ROLE_ID],
      ["media", MEDIA_ROLE_ID],
      ["scores", SCORES_ROLE_ID],
    ]);

    const roleToGive = roleMap.get(buttonInteraction.customId);

    if (!roleToGive) return;

    const hasRole = discordMember.roles.cache.some(
      (role) => role.id == roleToGive
    );

    if (hasRole) {
      discordMember.roles.remove(roleToGive);
    } else {
      discordMember.roles.add(roleToGive);
    }

    buttonInteraction.deferUpdate();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log("Ready!");
    console.log(client);

    // startSixMan(client);

    while (true) {
      await muteChecker(client);
      await sleep(6000);
    }

    // sendInformation(client);

    // const signedUpPlayersEmbed = new MessageEmbed().setTitle("HEY!!!");

    // await client.channels.cache.get(REGISTERED_LIST_ID).send({
    //   embeds: [signedUpPlayersEmbed],
    // });

    // await client.channels.cache
    //   .get(REGISTERED_LIST_ID)
    //   .messages.fetch(REGISTERED_LIST_MESSAGE_ID)
    //   .then((message) => message.edit({ embeds: [signedUpPlayersEmbed] }));
  },
};
