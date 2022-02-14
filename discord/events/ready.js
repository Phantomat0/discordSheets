const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const mainDatabase = require("../../database/main/main");
const {
  INFORMATION_ID,
  REGISTRATION_ID,
  AWARD_VOTING_ID,
  SIGNUP_ID,
  TICKETS_ID,
} = require("../config/channels");
const { MODERATOR_ROLE_ID, DONATOR_ROLE_ID } = require("../config/roles");
const { LOGO_URL } = require("../config/logo");
const { GUILD_ID } = require("../config/config");
const { CommandError } = require("../utils/errors");
const {
  WavingHand,
  PageCurled,
  SmallWhiteSquare,
  QuestionMark,
  Bell,
  MoneyBag,
  Abascus,
  Ballot,
  OrangeBook,
} = require("../utils/icons");
const { getCancelAndConfirmButtonRow } = require("../utils/buttons");
const { successEmbedCreator } = require("../utils/embeds");
const {
  sendInteractionCompleted,
  sendInteractionTimedOut,
} = require("../utils/bot-utils");

const updateTournyPlayers = require("../updatetourny");
const muteChecker = require("../mutechecker");
const deployCommandPermissions = require("../deploy-command-perms");
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
      .setStyle("PRIMARY")
    // new MessageButton()
    //   .setCustomId("scores")
    //   .setLabel("Scores")
    //   .setStyle("PRIMARY")
  );

  const gameRulesStr = [
    "**4v4 only**, no 3v3, no 3v4",
    "Games consist of two **7**-minute halves.",
    "No Draws, should the game be tied after 14 minutes of play, **7**-minute overtime periods will be played, until a winner is decided. No golden goal",
    "Games are declared a forfeit should a team be unable to field **4** players, **15** minutes after the scheduled game time.",
    "Players must verify using and only using the official verification system for our league, with no exceptions given.",
  ]
    .map((rule) => `${SmallWhiteSquare} ${rule}`)
    .join("\n\n");

  const teamRulesStr = [
    "Teams have divisional affiliates, with players having the ability to be called up to play in games in higher divisions",
    "Roster Limits:\nDivision 1: 6\nDivison 2: 6\nDivison 3: 8",
  ]
    .map((rule) => `${SmallWhiteSquare} ${rule}`)
    .join("\n\n");

  const PlayerRulesStr = [
    "Players who sign up after the draft must first undergo a waiver process in order to be signed, where teams have the ability to place claims on players",
    "Waivers run every Tuesday at **10PM EST**. Players must have been signed up for at least 24 hours before they can be considered for the weekly waiver run.",
    "Should a player go through the waiver process without being claimed, they are moved to Free Agency, where they may be signed at anytime, on a first come first serve basis.",
    "Should a D1 or D2 player be released from their team, specific limitations prevent them from being instantly signed to a lower division. These limitations are staying are processing waivers, and a 24 hour D3 sign restriction respectively.",
  ]
    .map((rule) => `${SmallWhiteSquare} ${rule}`)
    .join("\n\n");

  const ruleBookEmbed = new MessageEmbed()
    .setTitle("Rules Overview")
    .setColor("#fd7e14")
    .setDescription(
      `**:small_orange_diamond: Game**\n\n${gameRulesStr}\n\n**:small_orange_diamond: Teams**\n\n${teamRulesStr}\n\n**:small_orange_diamond: Free Agency**\n\n${PlayerRulesStr}`
    );

  const rulebookLinkEmbed = new MessageEmbed()
    .setTitle(`${OrangeBook}  AF Official Rulebook`)
    .setURL("https://discord.js.org/")
    .setColor("#fd7e14")
    .setDescription(
      "View the official rulebook document by visiting the link above, which includes outlines more specific rules and procedures for various league events."
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
      `North America's most profound futsal league!\n\nWe are a competitive 4v4 haxball league with three divisions and biweekly games.\n A little more about us:\n\n ${SmallWhiteSquare} Draft style league, managers choose players to sign\n${SmallWhiteSquare} Three divisions with affiliation\n${SmallWhiteSquare} Champion declared at the end of every season for each division\n${SmallWhiteSquare} Weekly games, no reschedules unless mutually agreed upon\n${SmallWhiteSquare} Haxball's best antifake, Haxball and Discord authentication\n${SmallWhiteSquare} Seasonal fun tournaments in other modes\n\nView more about our league structure in <#>`
    );

  const rulesArray = [
    `**Do not** post spam. No content such as, but not limited to: discord invite links/qr codes, videos, images, advertising services, surveys, referral links of any and all kinds.`,
    `**Do not** bypass our filters, disrupt voice/text chat, impersonate users, claim to be any kind of moderator, engage in hate speech about other members.`,
    `**Do not** post content that is abusive, threatening, defamatory, racist, sexual, religious, relates to self-harm or is otherwise objectionable/offensive. Moderators also reserve the right to remove anything considered to be edgy or baiting.`,
    `Usernames, status messages and avatars must be appropriate. They should not be Blank names, Zalgo, impersonating, advertising, overly lengthy names, slurs, or any other offensive material.`,
    `Only one Discord account per person in the server at any time unless given direct authorization from an Admin.`,
  ];

  const rulesStr = rulesArray
    .map((rule) => `:small_blue_diamond: ${rule}`)
    .join("\n\n");

  await client.guilds.cache.get(GUILD_ID).members.fetch();

  const moderatorsIdArray = await client.guilds.cache
    .get(GUILD_ID)
    .roles.cache.get(MODERATOR_ROLE_ID)
    .members.map((m) => m.user.id);

  const staffArray = [
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
    {
      name: "Brian",
      discordID: "658533411442524200",
    },
  ];

  const moderatorListStr = moderatorsIdArray.map((id) => `<@${id}>`).join("\n");
  const adminListStr = staffArray
    .map((admin) => `${admin.name} <@${admin.discordID}>`)
    .join("\n");
  const staffEmbed = new MessageEmbed()
    .setTitle(`${Abascus}  Staff`)
    .setColor("#3F9630")
    .setDescription(
      `Want a clarification on rules? Want to report in game rule breaking? Contact an Admin.\n\nEncounter something that you think require moderator intervention, or just need any Discord help? Contact the moderator team and let them know.\n\n**Staff**\n${adminListStr}\n\n**Moderators**\n${moderatorListStr}`
    );

  const rulesEmbed = new MessageEmbed()
    .setTitle(`${PageCurled}  Server Rules`)
    .setColor("#3B88C3")
    .setDescription(
      `${rulesStr}\n\n:warning: This list does not constitute the full set of rules, and our Moderators may take action on misbehavior and violations that are not explicitly listed below. At all times, use common sense and good judgement for any action you're about to take\n\n:information_source: Our server rules are in addition to Discord's [terms of service](https://discord.com/terms 'Discord terms of service') and [community guidelines](https://discord.com/guidelines 'community guidelines').\n\n We take the listed rules very seriously. We are committed in ensuring a welcoming and non-toxic environment for our members. A mute will be your first warning for an offense, subsequent offenses will be handled accordingly with further mutes and suspensions. `
    );

  const faqEmbed = new MessageEmbed()
    .setTitle(`${QuestionMark} FAQ`)
    .setColor("#F52727")
    .addField(
      "How do I join a team?",
      `To join a team, you must first register for the league. Begin by going to <#${REGISTRATION_ID}> and using the /register command and filling out the form. From there, you wait to be picked up by a team.`,
      false
    )
    .addField(
      "What if I am an inexperienced or new player?",
      "Thankfully, the league is split into three divisions, Division 1 for more experienced players, Division 2 for intermediate players, and Division 3 for new players who are looking to prove themselves.",
      false
    )
    .addField(
      "When are games played?",
      `**Division 1** Tuesdays and Thursdays 7PM EST \n **Division 2** Tuesdays and Thursdays 6PM EST \n **Division 3** Mondays and Fridays 6PM EST`,
      false
    )
    .addField(
      "I have a suggestion for the league and or want to help out with the league?",
      `You can post any suggestions in <#888561683520430130>. We are always open to players looking to offer to help in any way they can, please direct any such requests to an <@&887376620602671185>`,
      false
    )
    .addField(
      "Who do I contact regarding an issue with the public rooms?",
      `All public rooms are overseen by pub admins. You can post a claim in the appropriate channel below to get a response back from one of them.\nIssues/Reports: <#896792007723339817>`,
      false
    )
    .addField(
      "I was banned from one of the public rooms, how do I get unbanned?",
      `Create a ban appeal ticket in <#923306571524624384> and patiently wait for a response in <#907811986740478004>`,
      false
    )
    .addField(
      "Who do I contact regarding an issue with the Discord?",
      `Any issues or concerns regarding the Discord should be forwared to any of the moderators listed below in the staff section. `,
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

  // await client.channels.cache.get(INFORMATION_ID).send({
  //   embeds: [rulebookLinkEmbed, ruleBookEmbed],
  // });

  // const currentChannel = await client.channels.cache.get(INFORMATION_ID);

  // const collector = currentChannel.createMessageComponentCollector({
  //   componentType: "BUTTON",
  // });

  // collector.on("collect", async (buttonInteraction) => {
  //   const discordMember = buttonInteraction.member;

  //   const roleMap = new Map([
  //     ["announcement", ANNOUNCEMENT_ROLE_ID],
  //     ["media", MEDIA_ROLE_ID],
  //     ["scores", SCORES_ROLE_ID],
  //   ]);

  //   const roleToGive = roleMap.get(buttonInteraction.customId);

  //   if (!roleToGive) return;

  //   const hasRole = discordMember.roles.cache.some(
  //     (role) => role.id == roleToGive
  //   );

  //   if (hasRole) {
  //     discordMember.roles.remove(roleToGive);
  //   } else {
  //     discordMember.roles.add(roleToGive);
  //   }

  //   buttonInteraction.deferUpdate();
  // });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log("Ready!");

    // deployCommandPermissions(client);

    // const dumbEmbed = new MessageEmbed()
    //   .setTitle("Registration")
    //   .setDescription("Test");

    const ticketsEmbed = new MessageEmbed()
      .setTitle(`${Ballot} Tickets`)
      .setColor("#5DADEC")
      .setDescription(
        `Use this channel to submit support tickets. To submit a ticket, use the **/ticket** command with any of the following options below and fill out the form.\n\n**ban-appeal** For public room ban appeals`
      );

    const awardsEmbed1 = new MessageEmbed()
      .setTitle("Registration")
      .setDescription(
        "Use the **/register** command to begin the registration process. Fill out your name, position, availability, and info."
      );

    // await client.channels.cache.get(TICKETS_ID).send({
    //   embeds: [ticketsEmbed],
    // });

    sendInformation(client);

    // await client.channels.cache.get(SIGNUP_ID).send({
    //   embeds: [dumbEmbed],
    // });

    // await client.channels.cache.get(SIGNUP_ID).send({
    //   embeds: [awardsEmbed],
    // });

    const awardsEmbed = new MessageEmbed()
      .setTitle("Season 2 Awards")
      .setDescription(
        "Vote for awards in this channel using the **/awards** command. Some rules: \nYou must have been registered for the current season in order to be eligible to vote.\nOnly one vote per division\nYou must place a vote for each award\nPrimary and Secondary options for Best Player cannot be the same\n**Award Voting closes January 11th 10:59PM EST**"
      );

    await client.channels.cache.get("929485179481890816").send({
      embeds: [awardsEmbed],
    });

    // startSixMan(client);

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
