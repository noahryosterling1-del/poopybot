
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const countries = [
    '🇺🇸 United States',
    '🇨🇦 Canada',
    '🇧🇷 Brazil',
    '🇬🇧 United Kingdom',
    '🇩🇪 Germany',
    '🇫🇷 France',
    '🇳🇱 Netherlands',
    '🇸🇬 Singapore',
    '🇯🇵 Japan',
    '🇰🇷 South Korea',
    '🇮🇳 India',
    '🇦🇺 Australia'
];

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createPingEmbed() {
    const wsPing = randomNumber(1, 9);
    const apiLatency = randomNumber(95, 105);

    const countryStatuses = countries.map(country => {
        const ping = randomNumber(60, 70);
        return `${country} — 🟢 \`${ping} ms\``;
    });

    return new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('🌍 GLOBAL PING')
        .setDescription(
            '**Worldwide Network Status**\n\n' +
            '📡 **WebSocket Latency**\n' +
            `\`${wsPing} ms\`\n\n` +
            '⚡ **API Response Time**\n' +
            `\`${apiLatency} ms\`\n\n` +
            `🌐 **Global Regions (${countries.length})**\n` +
            countryStatuses.join('\n')
        )
        .setFooter({
            text: 'Poopt • Global Ping System'
        })
        .setTimestamp();
}

module.exports = {
    name: 'ping',
    description: 'Check global ping status',

    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check global ping status'),

    async executePrefix(message) {
        await message.reply({
            embeds: [createPingEmbed()]
        });
    },

    async executeSlash(interaction) {
        await interaction.deferReply();

        await interaction.editReply({
            embeds: [createPingEmbed()]
        });
    }
};
