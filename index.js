
require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection,
    REST,
    Routes
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TOKEN;
const PREFIX = process.env.PREFIX || '!';

if (!TOKEN) {
    console.error('❌ TOKEN is missing from your .env file!');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildExpressions
    ],

    partials: [
        Partials.Message,
        Partials.Channel
    ]
});

client.commands = new Collection();

// ==========================================
// LOAD COMMANDS
// ==========================================

const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
}

const commandFiles = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const filePath = path.join(commandsPath, file);

        // Clear cached module before loading.
        const command = require(filePath);

        if (!command.name) {
            console.warn(`⚠️ Skipping ${file}: missing command name.`);
            continue;
        }

        client.commands.set(command.name, command);

        console.log(`✅ Loaded command: ${command.name}`);

        // Initialize event-based systems such as logging.
        if (typeof command.init === 'function') {
            command.init(client);
            console.log(`✅ Initialized system: ${command.name}`);
        }
    } catch (error) {
        console.error(`❌ Failed to load ${file}:`, error);
    }
}

// ==========================================
// BOT READY + GLOBAL SLASH COMMANDS
// ==========================================

client.once('ready', async () => {
    console.log('================================');
    console.log(`🤖 Bot: ${client.user.tag}`);
    console.log(`🆔 Bot ID: ${client.user.id}`);
    console.log(`📦 Commands: ${client.commands.size}`);
    console.log(`🏠 Servers: ${client.guilds.cache.size}`);
    console.log(`⌨️ Prefix: ${PREFIX}`);
    console.log('================================');

    try {
        const rest = new REST({ version: '10' })
            .setToken(TOKEN);

        const slashCommands = [
            ...client.commands.values()
        ]
            .filter(command =>
                command.data &&
                typeof command.executeSlash === 'function'
            )
            .map(command => command.data.toJSON());

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: slashCommands }
        );

        console.log(
            `✅ Registered ${slashCommands.length} global slash command(s).`
        );
    } catch (error) {
        console.error('❌ Slash command registration failed:', error);
    }
});

// ==========================================
// PREFIX COMMAND HANDLER
// Example: !ping
// ==========================================

client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content
        .slice(PREFIX.length)
        .trim()
        .split(/\s+/);

    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = client.commands.get(commandName);

    if (!command ||
        typeof command.executePrefix !== 'function') {
        return;
    }

    try {
        await command.executePrefix(message, client, args);
    } catch (error) {
        console.error(
            `❌ Prefix command "${commandName}" failed:`,
            error
        );

        await message.reply({
            content: '❌ An error occurred while running this command.',
            allowedMentions: { repliedUser: false }
        }).catch(() => {});
    }
});

// ==========================================
// SLASH COMMAND HANDLER
// Example: /ping
// ==========================================

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command ||
        typeof command.executeSlash !== 'function') {
        return;
    }

    try {
        await command.executeSlash(interaction, client);
    } catch (error) {
        console.error(
            `❌ Slash command "${interaction.commandName}" failed:`,
            error
        );

        const response = {
            content: '❌ An error occurred while running this command.',
            ephemeral: true
        };

        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(response).catch(() => {});
        } else {
            await interaction.reply(response).catch(() => {});
        }
    }
});

// ==========================================
// DISCORD CLIENT ERROR HANDLING
// ==========================================

client.on('error', error => {
    console.error('❌ Discord client error:', error);
});

client.on('warn', warning => {
    console.warn('⚠️ Discord warning:', warning);
});

// ==========================================
// LOGIN
// ==========================================

client.login(TOKEN).catch(error => {
    console.error('❌ Discord login failed:', error);
});
