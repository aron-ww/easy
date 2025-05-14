const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const express = require('express');
const app = express();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});
const distube = new DisTube(client, {
  plugins: [new SpotifyPlugin(), new YtDlpPlugin()]
});
const prefix = ".";

app.get('/', (req, res) => res.send('Dormophors is online.'));
app.listen(process.env.PORT || 3000, () => console.log('Express ping server running.'));

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const embed = new EmbedBuilder()
    .setColor("DarkButNotBlack")
    .setFooter({ text: "Coded with ❤️ by aron.ww" })
    .setThumbnail("https://i.gifer.com/origin/60/606dc4f509be21ae620b538570dc1417_w200.gif");

  // Moderation
  if (command === 'mute') {
    const member = message.mentions.members.first();
    if (member) {
      await member.timeout(10 * 60 * 1000);
      embed.setTitle("User Muted").setDescription(`${member} has been muted.`);
    } else embed.setTitle("Error").setDescription("Mention a valid user.");
    message.channel.send({ embeds: [embed] });
  } else if (command === 'unmute') {
    const member = message.mentions.members.first();
    if (member) {
      await member.timeout(null);
      embed.setTitle("User Unmuted").setDescription(`${member} has been unmuted.`);
    } else embed.setTitle("Error").setDescription("Mention a valid user.");
    message.channel.send({ embeds: [embed] });
  } else if (command === 'ban') {
    const member = message.mentions.members.first();
    if (member) {
      await member.ban();
      embed.setTitle("User Banned").setDescription(`${member} has been banned.`);
    } else embed.setTitle("Error").setDescription("Mention a valid user.");
    message.channel.send({ embeds: [embed] });
  } else if (command === 'kick') {
    const member = message.mentions.members.first();
    if (member) {
      await member.kick();
      embed.setTitle("User Kicked").setDescription(`${member} has been kicked.`);
    } else embed.setTitle("Error").setDescription("Mention a valid user.");
    message.channel.send({ embeds: [embed] });
  } else if (command === 'purge') {
    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount)) return;
    const msgs = await message.channel.bulkDelete(amount);
    embed.setTitle("Messages Purged").setDescription(`Deleted ${msgs.size} messages.`);
    message.channel.send({ embeds: [embed] }).then(m => setTimeout(() => m.delete(), 3000));
  } else if (command === 'purgebots') {
    const messages = await message.channel.messages.fetch({ limit: 100 });
    const botMsgs = messages.filter(m => m.author.bot);
    await message.channel.bulkDelete(botMsgs);
    embed.setTitle("Bot Messages Purged").setDescription(`Deleted ${botMsgs.size} bot messages.`);
    message.channel.send({ embeds: [embed] });
  }

  // Music
  else if (command === 'play') {
    const query = args.join(" ");
    distube.play(message.member.voice.channel, query, { textChannel: message.channel, member: message.member });
  } else if (command === 'pause') {
    distube.pause(message);
    embed.setTitle("Paused").setDescription(`Playback paused.`);
    message.channel.send({ embeds: [embed] });
  } else if (command === 'skip') {
    distube.skip(message);
    embed.setTitle("Skipped").setDescription(`Skipped song.`);
    message.channel.send({ embeds: [embed] });
  } else if (command === 'queue') {
    const queue = distube.getQueue(message);
    if (!queue) return message.channel.send("No queue.");
    embed.setTitle("Queue").setDescription(queue.songs.map((s, i) => `${i + 1}. ${s.name}`).join("\n"));
    message.channel.send({ embeds: [embed] });
  } else if (command === 'playlist') {
    const playlist = args.join(" ");
    distube.play(message.member.voice.channel, playlist, { textChannel: message.channel, member: message.member });
  }

  // Utility
  else if (command === 'av') {
    const user = message.mentions.users.first() || message.author;
    embed.setTitle("Avatar").setImage(user.displayAvatarURL({ dynamic: true }));
    message.channel.send({ embeds: [embed] });
  } else if (command === 'banner') {
    const user = message.mentions.users.first() || message.author;
    const fetchedUser = await client.users.fetch(user.id, { force: true });
    if (fetchedUser.banner) {
      embed.setTitle("Banner").setImage(fetchedUser.bannerURL({ dynamic: true, size: 4096 }));
    } else {
      embed.setTitle("No Banner").setDescription("This user has no banner.");
    }
    message.channel.send({ embeds: [embed] });
  } else if (command === 'ui') {
    const member = message.mentions.members.first() || message.member;
    embed.setTitle("User Info")
      .addFields(
        { name: 'Username', value: member.user.tag },
        { name: 'ID', value: member.id },
        { name: 'Joined', value: member.joinedAt.toDateString() }
      );
    message.channel.send({ embeds: [embed] });
  } else if (command === 'serverinfo') {
    embed.setTitle("Server Info")
      .addFields(
        { name: 'Server Name', value: message.guild.name },
        { name: 'Members', value: `${message.guild.memberCount}` },
        { name: 'Created On', value: message.guild.createdAt.toDateString() }
      );
    message.channel.send({ embeds: [embed] });
  }

  // Basics
  else if (command === 'ping') {
    embed.setTitle("Pong!").setDescription(`Latency: ${Date.now() - message.createdTimestamp}ms`);
    message.channel.send({ embeds: [embed] });
  } else if (command === 'help') {
    embed.setTitle("Dormophors Bot Help").setDescription(`Prefix: \\`${prefix}\\``)
      .addFields(
        { name: 'Moderation', value: 'mute, unmute, ban, kick, purge, purgebots' },
        { name: 'Music', value: 'play, pause, skip, queue, playlist' },
        { name: 'Utility', value: 'av, banner, ui, serverinfo' },
        { name: 'Basics', value: 'help, ping' }
      );
    message.channel.send({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
