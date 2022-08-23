// ----------------------------------------------------------------------------------//
// RADAR Portal
// Whitelist onboarding bot (( BETA v0.1.1 ))
// Fiigmnt | Febuary 9, 2022 | Updated: August 23, 2022
// ----------------------------------------------------------------------------------//

import {
  Client,
  Intents,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  Interaction,
} from "discord.js";
import Airtable from "airtable";
import dotenv from "dotenv";

dotenv.config();

// This should match the one in the airtable exactly
const tagColumnName = "Discord (don’t forget to include the # number. E.g Futurist#1234)"

const { DISCORD_TOKEN, AIRTABLE_TOKEN, AIRTABLE_TABLE_KEY, ROLE_ID } =
  process.env;

const base = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(
  AIRTABLE_TABLE_KEY || ""
);
const table = base("Table 1");

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

client.once("ready", () => console.log("Bot is ready"));

const isUserAccepted = async (i: Interaction) => {
  const tag = i.user.tag;

  console.log("-- USER --");
  console.log(tag);

  try {
    // find record in airtable with the email, and make sure they were approved by an admin
    const result = await table
      .select({
        filterByFormula: `AND({${tagColumnName}} = "${tag}", {Approved} = TRUE())`,
      })
      .firstPage();

    return !!result.length;
  } catch (error) {
    console.log(error);
  }
};

// on bot being added to server
client.on("guildCreate", async (guild) => {
  try {
    console.log(
      `New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`
    );

    // create connect channel
    const connectChannel = await guild.channels.create("radar-portal", {
      type: "GUILD_TEXT",
    });

    if (connectChannel?.id) {
      // create button in channel
      const joinButton = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId("join")
          .setLabel("Join")
          .setStyle("PRIMARY")
      );

      const joinInfo = new MessageEmbed()
        .setTitle("Wecome to RADAR")
        .setDescription("Click to see if you're in on the list");

      await connectChannel.send({
        embeds: [joinInfo],
        components: [joinButton],
      });
    } else {
      throw new Error("Couldn't create channel");
    }
  } catch (error: any) {
    throw new Error(error);
  }
});

// read button interactions
client.on("interactionCreate", async (i) => {
  if (!i.isButton()) return;

  try {
    // check to see if they're in the waitlist
    if (
      i.customId === "join" &&
      (await isUserAccepted(i))
    ) {
      let role = i.guild?.roles.cache.find((r) => r.id === ROLE_ID);

      if (role) {
        const member = i.guild?.members.cache.find(
          (member) => member.id === i.user.id
        );

        if (member) member.roles.add(role);
      }

      await i.reply({
        content: `Welcome to the future of futures ${i.user.username}`,
        ephemeral: true,
      });
    } else {
      console.log("Not Accepted");
      const denyButton = new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel("Make sure you’ve applied here")
          .setStyle("LINK")
          .setURL("https://airtable.com/shrFKUzeNpJoDU0x9")
      );
      await i.reply({
        content:
          "Sorry, we can’t find you on the list.\nIs this an error? Reach out via the <#935863986522558494> channel.",
        ephemeral: true,
        components: [denyButton],
      });
    }
  } catch (error) {
    console.log(error);
  }
});

client.login(DISCORD_TOKEN);
