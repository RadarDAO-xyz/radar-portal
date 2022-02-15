"use strict";
// ----------------------------------------------------------------------------------//
// RADAR
// Whitelist onboarding bot (( BETA v0.1.0 ))
// Fiigmnt | Febuary 9, 2022 | Updated:
// ----------------------------------------------------------------------------------//
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const airtable_1 = __importDefault(require("airtable"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { DISCORD_TOKEN, ONBOARDING_CHANNEL_ID, AIRTABLE_TOKEN, AIRTABLE_TABLE_KEY, } = process.env;
const base = new airtable_1.default({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_TABLE_KEY || "");
const table = base("Table 1");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.Intents.FLAGS.GUILDS,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
    partials: ["MESSAGE", "CHANNEL", "REACTION"],
});
client.once("ready", () => {
    console.log("Bot is ready");
});
const isUserAccepted = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    const username = `${interaction.user.username}#${interaction.user.discriminator}`;
    console.log("-- USER --");
    console.log(username);
    try {
        // // find record in airtable with the email
        const result = yield table
            .select({
            filterByFormula: `({Discord (don’t forget to include the # number. E.g Futurist#1234)} = "${username}")`,
        })
            .firstPage();
        return !!result.length;
    }
    catch (error) {
        console.log(error);
    }
});
// on bot being added to server
client.on("guildCreate", (guild) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
        // create connect channel
        const connectChannel = yield guild.channels.create("connect", {
            type: "GUILD_TEXT",
        });
        if (connectChannel === null || connectChannel === void 0 ? void 0 : connectChannel.id) {
            // create button in channel
            const joinButton = new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton()
                .setCustomId("join")
                .setLabel("Join Server")
                .setStyle("PRIMARY")
            // .setURL("https://daobridge.xyz")
            );
            const joinInfo = new discord_js_1.MessageEmbed()
                // .setColor("#0099ff")
                .setTitle("RADAR connect")
                .setDescription("Check to see if you're on the whitelist");
            yield connectChannel.send({
                // content: "Please continue to daotodao.xyz to connect your wallet.",
                embeds: [joinInfo],
                components: [joinButton],
            });
        }
        else {
            throw new Error("Couldn't create channel");
        }
    }
    catch (error) {
        throw new Error(error);
    }
}));
// read button interactions
client.on("interactionCreate", (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!interaction.isButton())
        return;
    // check to see if they're in the waitlist
    if (interaction.customId === "join" && (yield isUserAccepted(interaction))) {
        let role = (_a = interaction.guild) === null || _a === void 0 ? void 0 : _a.roles.cache.find((r) => r.id === "942577914476630016");
        if (role) {
            const member = (_b = interaction.guild) === null || _b === void 0 ? void 0 : _b.members.cache.find((member) => member.id === interaction.user.id);
            if (member)
                member.roles.add(role);
        }
        yield interaction.reply({
            content: `Welcome to the server ${interaction.user.username}!`,
            ephemeral: true,
            // components: [linkButton],
        });
    }
    else {
        yield interaction.reply({
            content: "I'm sorry, you're not on the waitlist.",
            ephemeral: true,
            // components: [linkButton],
        });
    }
}));
client.login(DISCORD_TOKEN);
